<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Visitor;
use App\Support\VisitingHours;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuardController extends Controller
{
    // Verify visitor QR code. Nothing from the scanned string is ever trusted
    // beyond the token itself — every field returned here comes from a fresh
    // database lookup, never from the QR payload. Every outcome (success or
    // failure) is logged so it shows up under "recent verification attempts".
    public function verifyQr(
        Request $request
    ): JsonResponse {

        $validated = $request->validate([
            'qr_token' => ['required', 'string',],
        ]);

        $qrData = $validated['qr_token'];

        // Token format valid?
        if (!str_starts_with($qrData, 'VMS-')) {
            return $this->logAttempt($request, 'invalid_qr', 'Invalid QR code.');
        }
        // Remove VMS- prefix
        $token = substr($qrData, 4);

        // Token / registration exists?
        // Load resident information at the same time
        $visitor = Visitor::with('resident')
            ->where('qr_token', $token)
            ->first();

        if (!$visitor) {
            return $this->logAttempt($request, 'not_registered', 'Visitor registration not found.');
        }

        // Token expired?
        if (
            $visitor->qr_expires_at &&
            $visitor->qr_expires_at->isPast()
        ) {
            return $this->logAttempt($request, 'expired_qr', 'QR code has expired.', $visitor);
        }

        // Token revoked?
        if ($visitor->qr_revoked_at) {
            return $this->logAttempt($request, 'revoked_qr', 'QR code has been revoked.', $visitor);
        }

        // Registration cancelled?
        if ($visitor->status === 'cancelled') {
            return $this->logAttempt($request, 'cancelled', 'Visitor registration was cancelled.', $visitor);
        }

        // Resident account active?
        if (!$visitor->resident || $visitor->resident->status !== 'active') {
            return $this->logAttempt($request, 'resident_inactive', 'The resident account for this visitor is not active.', $visitor);
        }

        // Visitor already checked in? (checked_in_at and qr_used_at are always
        // set together on approval, so either one signals a used QR — this
        // also correctly blocks re-entry attempts after a checkout, since
        // checkout never clears these fields.)
        if ($visitor->checked_in_at || $visitor->qr_used_at) {
            return $this->logAttempt($request, 'already_checked_in', 'Visitor has already checked in.', $visitor);
        }

        // Visitor registration valid? (catch-all for any other non-upcoming
        // state, e.g. a rejected registration reusing the same token)
        if ($visitor->status !== 'upcoming') {
            return $this->logAttempt($request, 'invalid_status', 'Visitor registration is not available for entry.', $visitor);
        }

        // Within allowed visiting hours? Checked last, immediately before
        // VALID, so a QR that's already unusable for another reason reports
        // that more specific reason instead.
        if (!VisitingHours::contains(now()->format('H:i'))) {
            return $this->logAttempt($request, 'outside_visiting_hours', 'Visitor entry is outside permitted visiting hours.', $visitor);
        }

        // Valid
        $this->logAttempt($request, null, 'QR code is valid.', $visitor, valid: true);

        return response()->json([
            'valid' => true,
            'message' => 'QR code is valid.',
            'visitor' => [
                'id' => $visitor->id,
                'name' => $visitor->name,
                'phone' => $visitor->phone,
                'purpose' => $visitor->purpose,
                'unit' => $visitor->unit,
                'expected_at' => $visitor->expected_at,
                'status' => $visitor->status,
                'qr_status' => $visitor->qr_status,

                'resident' => $visitor->resident ? [
                    'id' => $visitor->resident->id,
                    'name' => $visitor->resident->name,
                    'email' => $visitor->resident->email,
                ] : null,
            ],
        ]);
    }

    public function approve(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        return DB::transaction(function () use ($request, $visitor) {

            // Re-fetch under a row lock so two guards approving the same
            // visitor at the same instant can't both succeed — the second
            // transaction blocks here until the first commits, then sees
            // the now-updated status and is correctly rejected below.
            $locked = Visitor::where('id', $visitor->id)->lockForUpdate()->first();

            // Visitor must be upcoming
            if ($locked->status !== 'upcoming') {
                return response()->json([
                    'message' => 'Visitor cannot be approved.',
                ], 422);
            }

            // QR must exist
            if (!$locked->qr_token) {
                return response()->json([
                    'message' => 'Visitor does not have a valid QR code.',
                ], 422);
            }

            // QR must not be expired
            if ($locked->qr_expires_at && $locked->qr_expires_at->isPast()) {
                return response()->json([
                    'message' => 'QR code has expired.',
                ], 422);
            }

            // QR must not be revoked
            if ($locked->qr_revoked_at) {
                return response()->json([
                    'message' => 'QR code has been revoked.',
                ], 422);
            }

            // QR already used?
            if ($locked->qr_used_at) {
                return response()->json([
                    'message' => 'QR code has already been used.',
                ], 422);
            }

            // Record QR use, check-in, and the approving guard
            $locked->update([
                'qr_used_at' => now(),
                'status' => 'checked_in',
                'checked_in_at' => now(),
                'approved_by' => $request->user()->id,
            ]);

            // Approval and check-in happen as one atomic step in this app's
            // workflow (there is no separate "check in" action), so a single
            // log entry covers both.
            AuditLog::record(
                request: $request,
                action: 'approve_visitor',
                description: "Approved entry and checked in visitor: {$locked->name} (unit {$locked->unit})",
                userId: $request->user()->id,
                userRole: $request->user()->role,
                targetType: 'visitor',
                targetId: $locked->id,
            );

            return response()->json([
                'message' => 'Visitor entry approved.',
                'visitor' => $locked->fresh(),
            ]);
        });
    }

    public function reject(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255',],
        ]);

        return DB::transaction(function () use ($request, $visitor, $validated) {

            $locked = Visitor::where('id', $visitor->id)->lockForUpdate()->first();

            if ($locked->status !== 'upcoming') {
                return response()->json([
                    'message' => 'Visitor cannot be rejected.',
                ], 422);
            }

            $locked->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['reason'],
                'rejected_by' => $request->user()->id,
                'rejected_at' => now(),
            ]);

            AuditLog::record(
                request: $request,
                action: 'reject_visitor',
                description: "Rejected entry for visitor: {$locked->name} (unit {$locked->unit}). Reason: {$validated['reason']}",
                userId: $request->user()->id,
                userRole: $request->user()->role,
                targetType: 'visitor',
                targetId: $locked->id,
            );

            return response()->json([
                'message' => 'Visitor entry rejected.',
                'visitor' => $locked->fresh(),
            ]);
        });
    }

    public function checkout(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        return DB::transaction(function () use ($request, $visitor) {

            $locked = Visitor::where('id', $visitor->id)->lockForUpdate()->first();

            // Also covers "already checked out": once checked out, status is
            // no longer 'checked_in', so this same guard catches both cases.
            if ($locked->status !== 'checked_in') {
                return response()->json([
                    'message' => 'Visitor is not currently inside.',
                ], 422);
            }

            $locked->update([
                'status' => 'checked_out',
                'checked_out_at' => now(),
                'checked_out_by' => $request->user()->id,
            ]);

            AuditLog::record(
                request: $request,
                action: 'checkout_visitor',
                description: "Checked out visitor: {$locked->name} (unit {$locked->unit})",
                userId: $request->user()->id,
                userRole: $request->user()->role,
                targetType: 'visitor',
                targetId: $locked->id,
            );

            return response()->json([
                'message' => 'Visitor checked out successfully.',
                'visitor' => $locked->fresh(),
            ]);
        });
    }

    public function visitorLogs(
        Request $request
    ): JsonResponse {

        $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:upcoming,checked_in,checked_out,cancelled,expired,rejected'],
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $query = Visitor::with(['resident', 'approver', 'rejector', 'checkoutGuard']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('expected_at', $request->date);
        }

        // Paginated: unfiltered, this previously loaded the entire visitors
        // table on every guard log-page view, growing without bound.
        $visitors = $query
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json([
            'visitors' => $visitors,
        ]);
    }

    // Recent QR verification attempts (successful and failed), for the guard
    // dashboard. Shared across all guards, since gate activity is an
    // operational concern for the whole shift, not any one guard's own log.
    public function recentAttempts(
        Request $request
    ): JsonResponse {

        $attempts = AuditLog::with('user')
            ->where('action', 'verify_qr')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'attempts' => $attempts,
        ]);
    }

    // Log the outcome of a verification attempt, then return its JSON
    // response. Used for both failures (422, with a reason code) and the
    // successful case (200-shaped, but here we only care about the log entry
    // — the caller builds and returns the real success response itself).
    private function logAttempt(
        Request $request,
        ?string $reason,
        string $message,
        ?Visitor $visitor = null,
        bool $valid = false
    ): JsonResponse {

        $subject = $visitor
            ? "{$visitor->name} (unit {$visitor->unit})"
            : 'unregistered QR code';

        AuditLog::record(
            request: $request,
            action: 'verify_qr',
            description: $valid
                ? "QR verified: {$subject} — valid"
                : "QR verification failed ({$reason}): {$subject} — {$message}",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor?->id,
            result: $valid ? 'success' : 'failure',
        );

        if ($valid) {
            // Success response is built by the caller; this path exists only
            // to log — return value is unused there.
            return response()->json(['valid' => true]);
        }

        return response()->json([
            'valid' => false,
            'reason' => $reason,
            'message' => $message,
        ], 422);
    }

}
