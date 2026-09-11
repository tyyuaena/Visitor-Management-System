<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Visitor;
use App\Support\VisitingHours;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Models\SystemSetting;

class VisitorController extends Controller
{
    // Display all visitors belonging to the logged-in resident
    public function index(Request $request): JsonResponse
    {
        $visitors = $request->user()
            ->visitors()
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['visitors' => $visitors,]);
    }

    // Register a new visitor
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255',],
            'phone' => ['required', 'string', 'max:30',],
            'purpose' => ['required', 'string', 'max:255',],
            'expected_at' => ['required', 'date', 'after:now', function ($attribute, $value, $fail) { $this->assertWithinVisitingHours($attribute, $value, $fail); }, function ($attribute, $value, $fail) { $this->assertWithinAdvanceBookingWindow($attribute, $value, $fail); },],
        ]);

        // Admin-configured cap on how many visitors a resident may register
        // for the same day.
        $maxPerDay = $this->maxVisitorsPerDay();
        $sameDayCount = $request->user()
            ->visitors()
            ->whereDate('expected_at', Carbon::parse($validated['expected_at'])->toDateString())
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->count();

        if ($sameDayCount >= $maxPerDay) {
            return response()->json([
                'message' => "You have reached the maximum of {$maxPerDay} visitor registration(s) allowed per day.",
            ], 422);
        }

        $visitor = $request->user()
            ->visitors()
            ->create([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'purpose' => $validated['purpose'],
                // A visitor always belongs to the resident's own assigned unit —
                // residents cannot set an arbitrary unit for their visitors.
                'unit' => $request->user()->unit,
                'expected_at' => $validated['expected_at'],
                'status' => 'upcoming',

                // Generate a unique QR token
                'qr_token' => Str::random(64),

                'qr_expires_at' => now()->addHours($this->qrExpiryHours()),
            ]);

        AuditLog::record(
            request: $request,
            action: 'register_visitor',
            description: "Registered visitor: {$visitor->name} (unit {$visitor->unit})",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor->id,
        );

        return response()->json([
            'message' => 'Visitor registered successfully.',
            'visitor' => $visitor,
        ], 201);
    }

    // Display a specific visitor
    public function show(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        // Resource ownership authorization
        // This prevents one resident from viewing another resident's visitor
        $this->authorize('view', $visitor);
        return response()->json([ 'visitor' => $visitor, ]);
    }

    // Update visitor registration
    public function update(
        Request $request,
        Visitor $visitor
    ): JsonResponse {
        
        // Resource ownership + upcoming status
        $this->authorize('update', $visitor);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255',],
            'phone' => ['required', 'string', 'max:30',],
            'purpose' => ['required', 'string', 'max:255',],
            'expected_at' => ['required', 'date', 'after:now', function ($attribute, $value, $fail) { $this->assertWithinVisitingHours($attribute, $value, $fail); }, function ($attribute, $value, $fail) { $this->assertWithinAdvanceBookingWindow($attribute, $value, $fail); },],
        ]);

        // Re-check the per-day cap only if the visit is moving to a
        // different day — the visitor being edited is excluded from its own
        // count either way.
        $newDate = Carbon::parse($validated['expected_at'])->toDateString();
        if ($newDate !== $visitor->expected_at->toDateString()) {
            $maxPerDay = $this->maxVisitorsPerDay();
            $sameDayCount = $request->user()
                ->visitors()
                ->where('id', '!=', $visitor->id)
                ->whereDate('expected_at', $newDate)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->count();

            if ($sameDayCount >= $maxPerDay) {
                return response()->json([
                    'message' => "You have reached the maximum of {$maxPerDay} visitor registration(s) allowed per day.",
                ], 422);
            }
        }

        // Unit is intentionally not editable here — it stays tied to the
        // resident's own assigned unit, same as on creation.
        $visitor->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'purpose' => $validated['purpose'],
            'expected_at' => $validated['expected_at'],
        ]);

        $visitor->refresh();

        AuditLog::record(
            request: $request,
            action: 'update_visitor',
            description: "Updated visitor registration: {$visitor->name} (unit {$visitor->unit})",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor->id,
        );

        return response()->json([
            'message' => 'Visitor updated successfully.',
            'visitor' => $visitor,
        ]);
    }

    //Cancel visitor registration
    public function destroy(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        //Resource ownership authorization
        $this->authorize('delete', $visitor);

        //Only upcoming visitors should be cancelled
        if ($visitor->status !== 'upcoming') {
            return response()->json(['message' => 'Only upcoming visitors can be cancelled.',], 422);
        }

        // Cancel the visitor
        // Also revoke the QR credential so that it cannot be used at the guardhouse
        $visitor->update([
            'status' => 'cancelled',
            'qr_revoked_at' => now(),
        ]);

        AuditLog::record(
            request: $request,
            action: 'cancel_visitor',
            description: "Cancelled visitor registration: {$visitor->name} (unit {$visitor->unit})",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor->id,
        );

        // Logged as its own event, distinct from the cancellation itself,
        // since QR revocation is independently auditable.
        AuditLog::record(
            request: $request,
            action: 'revoke_qr',
            description: "Revoked QR code for visitor: {$visitor->name} (unit {$visitor->unit}) — registration cancelled",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor->id,
        );

        return response()->json(['message' => 'Visitor registration cancelled successfully.',]);
    }

    // Generate QR code for a visitor
    public function qr(
        Request $request,
        Visitor $visitor
    ): mixed {

        // Resource ownership authorization
        $this->authorize('view', $visitor);

        // Visitor must still be upcoming
        if ($visitor->status !== 'upcoming') {
            return response()->json([
                'message' => 'QR code cannot be generated for this visitor.',
            ], 422);
        }

        // Check whether QR has been revoked
        if ($visitor->qr_revoked_at) {
            return response()->json([
                'message' => 'QR code has been revoked.',
            ], 422);
        }

        // Create QR token if one does not exist
        if (!$visitor->qr_token) {

            $token = Str::random(64);

            $visitor->update([
                'qr_token' => $token,
                'qr_expires_at' => now()->addHours($this->qrExpiryHours()),
            ]);

            $visitor->refresh();

            // Logged only on actual token creation, not on every subsequent
            // fetch/display of an already-generated QR.
            AuditLog::record(
                request: $request,
                action: 'generate_qr',
                description: "Generated QR code for visitor: {$visitor->name} (unit {$visitor->unit})",
                userId: $request->user()->id,
                userRole: $request->user()->role,
                targetType: 'visitor',
                targetId: $visitor->id,
            );
        }

        // Check QR expiry
        if (
            $visitor->qr_expires_at &&
            $visitor->qr_expires_at->isPast()
        ) {
            return response()->json([
                'message' => 'QR code has expired.',
            ], 422);
        }

        // QR contains only verification token
        $qrData = 'VMS-' . $visitor->qr_token;

        // Generate QR image.
        // SVG is used because PNG output requires the Imagick PHP
        // extension, which isn't available in this environment.
        $qr = QrCode::format('svg')
            ->size(400)
            ->margin(2)
            ->generate($qrData);

        return response($qr)
            ->header('Content-Type', 'image/svg+xml');
    }

    // Issue a fresh QR token for a visitor, invalidating the previous one.
    // Only permitted while the registration is still upcoming — same rule as
    // editing/cancelling, since once checked in there's nothing left to scan.
    public function regenerateQr(
        Request $request,
        Visitor $visitor
    ): JsonResponse {

        $this->authorize('update', $visitor);

        // Replacing qr_token here is itself the revocation: the old token no
        // longer matches any record, so a guard scanning the previous QR
        // image gets "not_registered" instead of ever reaching this visitor.
        $visitor->update([
            'qr_token' => Str::random(64),
            'qr_expires_at' => now()->addHours($this->qrExpiryHours()),
            'qr_used_at' => null,
            'qr_revoked_at' => null,
        ]);

        AuditLog::record(
            request: $request,
            action: 'regenerate_qr',
            description: "Regenerated QR code for visitor: {$visitor->name} (unit {$visitor->unit}) — previous token invalidated",
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'visitor',
            targetId: $visitor->id,
        );

        return response()->json([
            'message' => 'QR code regenerated successfully.',
            'visitor' => $visitor->fresh(),
        ]);
    }

    // Validation rule: the scheduled visit time must fall within the
    // admin-configured visiting hours, not just be some future moment.
    private function assertWithinVisitingHours($attribute, $value, $fail): void
    {
        $time = Carbon::parse($value)->format('H:i');

        if (!VisitingHours::contains($time)) {
            [$start, $end] = VisitingHours::bounds();
            $fail("Visitors can only be scheduled between {$start} and {$end}.");
        }
    }

    // Configured QR expiry duration, falling back to 24 hours
    private function qrExpiryHours(): int
    {
        $hours = (int) SystemSetting::where(
            'key',
            'qr_expiry_hours'
        )->value('value');

        return $hours > 0 ? $hours : 24;
    }

    // Validation rule: visits cannot be booked further ahead than the
    // admin-configured advance-booking window.
    private function assertWithinAdvanceBookingWindow($attribute, $value, $fail): void
    {
        $days = $this->maxAdvanceBookingDays();
        $limit = now()->addDays($days)->endOfDay();

        if (Carbon::parse($value)->gt($limit)) {
            $fail("Visitors can only be scheduled up to {$days} day(s) in advance.");
        }
    }

    // Configured advance-booking window, falling back to 30 days
    private function maxAdvanceBookingDays(): int
    {
        $days = (int) SystemSetting::where(
            'key',
            'max_advance_booking_days'
        )->value('value');

        return $days > 0 ? $days : 30;
    }

    // Configured cap on visitors per resident per day, falling back to 10
    private function maxVisitorsPerDay(): int
    {
        $max = (int) SystemSetting::where(
            'key',
            'max_visitors_per_day'
        )->value('value');

        return $max > 0 ? $max : 10;
    }
}