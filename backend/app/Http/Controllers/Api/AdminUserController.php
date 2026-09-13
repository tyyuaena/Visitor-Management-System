<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\AccountToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    private const ACTIVATION_TOKEN_EXPIRY_MINUTES = 60 * 24;
    private const RESET_TOKEN_EXPIRY_MINUTES = 60;

    private const MANAGEABLE_ROLES = ['resident', 'guard', 'admin'];

    // Display residents, guards, and administrators
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'role' => ['sometimes', 'in:' . implode(',', self::MANAGEABLE_ROLES)],
            'status' => ['sometimes', 'in:active,pending,inactive'],
            'unit' => ['sometimes', 'string', 'max:50'],
            'search' => ['sometimes', 'string', 'max:255'],
        ]);

        $query = User::query()
            ->whereIn('role', self::MANAGEABLE_ROLES);

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by unit
        if ($request->filled('unit')) {
            $query->where('unit', $request->unit);
        }

        // Search by name, email, or unit
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%");
            });
        }

        $users = $query
            ->orderBy('role')
            ->orderBy('name')
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    // Create a resident, guard, or administrator account.
    // Residents and admins: no password is set here — the account activates
    // via an emailed link and the person sets their own password. This means
    // the admin creating another admin never learns that admin's password.
    // Guards: created active immediately with an admin-set password, as before.
    public function store(Request $request): JsonResponse
    {
        $role = $request->input('role');
        $needsActivation = $role === 'resident' || $role === 'admin';

        if ($needsActivation) {
            $rules = [
                'name' => ['required', 'string', 'max:255',],
                'email' => ['required', 'email', 'max:255', 'unique:users,email',],
                'role' => ['required', 'in:resident,admin',],
            ];

            if ($role === 'resident') {
                $rules['unit'] = ['required', 'string', 'max:50', 'exists:units,code',];
            }

            $validated = $request->validate($rules);

            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Str::random(40), // unusable placeholder; the person sets their own via activation
                'role' => $validated['role'],
                'unit' => $validated['unit'] ?? null,
                'status' => 'pending',
            ];

        } else {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255',],
                'email' => ['required', 'email', 'max:255', 'unique:users,email',],
                'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers(),],
                'role' => ['required', 'in:guard',],
            ]);

            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $validated['role'],
                'status' => 'active',
            ];
        }

        // The account row and its audit-log entry must succeed or fail
        // together — previously the email was sent (and could throw)
        // between the two, risking a created-but-unlogged account.
        $user = DB::transaction(function () use ($request, $userData) {
            $user = User::create($userData);

            // Record audit log — this is also where the account's role is
            // assigned (roles can't be changed after creation), so the
            // entry doubles as the role-assignment record.
            AuditLog::record(
                request: $request,
                action: 'create_user',
                description: 'Created ' . $user->role . ' account: ' . $user->email,
                userId: $request->user()->id,
                userRole: $request->user()->role,
                targetType: 'user',
                targetId: $user->id,
            );

            return $user;
        });

        // Sent after the account is durably created — a mail-transport
        // failure here shouldn't roll back (or 500) an otherwise-successful
        // account creation; the admin can resend via resendActivation().
        if ($needsActivation) {
            try {
                $this->sendActivationEmail($user);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => $user->role !== 'guard'
                ? ucfirst($user->role) . ' account created. An activation email has been sent.'
                : 'User account created successfully.',
            'user' => $user,
        ], 201);
    }

    // Update resident, guard, or administrator account
    public function update(
        Request $request,
        User $user
    ): JsonResponse {

        if (!in_array($user->role, self::MANAGEABLE_ROLES, true)) {
            return response()->json([
                'message' => 'This account cannot be managed here.',
            ], 422);
        }

        $rules = [
            'name' => ['required', 'string', 'max:255',],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id,],
            // Admin toggles between active/inactive only — "pending" is a
            // system state entered at creation and exited via activation.
            'status' => ['required', 'in:active,inactive',],
        ];

        if ($user->role === 'resident') {
            $rules['unit'] = ['required', 'string', 'max:50', 'exists:units,code',];
        }

        $validated = $request->validate($rules);

        // Never let an administrator lock themselves out by deactivating
        // their own account through this endpoint.
        if ($user->id === $request->user()->id && $validated['status'] === 'inactive') {
            throw ValidationException::withMessages([
                'status' => ['You cannot deactivate your own account.'],
            ]);
        }

        $oldStatus = $user->status;

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'status' => $validated['status'],
        ];

        if ($user->role === 'resident') {
            $updateData['unit'] = $validated['unit'];
        }

        $user->update($updateData);

        AuditLog::record(
            request: $request,
            action: 'update_user',
            description: 'Updated ' . $user->role . ' account: ' . $user->email .
                '. Status changed from ' . $oldStatus . ' to ' . $user->status,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'User account updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    // Deactivate resident, guard, or administrator account
    public function destroy(
        Request $request,
        User $user
    ): JsonResponse {

        if (!in_array($user->role, self::MANAGEABLE_ROLES, true)) {
            return response()->json([
                'message' => 'This account cannot be deactivated.',
            ], 422);
        }

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'status' => ['You cannot deactivate your own account.'],
            ]);
        }

        $user->update(['status' => 'inactive',]);

        AuditLog::record(
            request: $request,
            action: 'deactivate_user',
            description: 'Deactivated ' . $user->role . ' account: ' . $user->email,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'User account deactivated successfully.',
        ]);
    }

    // Resend the activation email for an account still awaiting activation
    public function resendActivation(
        Request $request,
        User $user
    ): JsonResponse {

        if (!in_array($user->role, self::MANAGEABLE_ROLES, true) || $user->status !== 'pending') {
            throw ValidationException::withMessages([
                'email' => ['This account is not awaiting activation.'],
            ]);
        }

        try {
            $this->sendActivationEmail($user);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Unable to send the activation email. Please try again.',
            ], 502);
        }

        AuditLog::record(
            request: $request,
            action: 'resend_activation',
            description: 'Resent activation email to: ' . $user->email,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'Activation email resent.',
        ]);
    }

    // Admin-initiated password reset: emails the account a reset link,
    // exactly like the self-service "forgot password" flow. The admin never
    // sees or sets the new password themselves.
    public function resetPassword(
        Request $request,
        User $user
    ): JsonResponse {

        if (!in_array($user->role, self::MANAGEABLE_ROLES, true) || $user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['This account is not eligible for a password reset.'],
            ]);
        }

        $token = AccountToken::issue('password_reset_tokens', $user->email);

        $link = config('app.frontend_url') . '/reset-password?email=' .
            urlencode($user->email) . '&token=' . $token;

        try {
            Mail::raw(
                "Hello {$user->name},\n\nAn administrator has triggered a password reset for your VMS account. "
                . "Use the link below to set a new password. This link expires in "
                . self::RESET_TOKEN_EXPIRY_MINUTES . " minutes.\n\n{$link}",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Your VMS password has been reset');
                }
            );
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Unable to send the password reset email. Please try again.',
            ], 502);
        }

        AuditLog::record(
            request: $request,
            action: 'admin_reset_password',
            description: 'Triggered a password reset for: ' . $user->email,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'Password reset email sent.',
        ]);
    }

    private function sendActivationEmail(User $user): void
    {
        $token = AccountToken::issue('account_activation_tokens', $user->email);

        $link = config('app.frontend_url') . '/activate?email=' .
            urlencode($user->email) . '&token=' . $token;

        Mail::raw(
            "Hello {$user->name},\n\nAn account has been created for you in the Smart Visitor Management System"
            . ($user->unit ? " for unit {$user->unit}" : "") . ".\n\n"
            . "Use the link below to activate your account and set your password. This link expires in "
            . round(self::ACTIVATION_TOKEN_EXPIRY_MINUTES / 60) . " hours.\n\n{$link}",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Activate your VMS account');
            }
        );
    }
}
