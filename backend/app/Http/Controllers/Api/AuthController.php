<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\AccountToken;
use App\Support\PasswordPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const RESET_TOKEN_EXPIRY_MINUTES = 60;
    private const ACTIVATION_TOKEN_EXPIRY_MINUTES = 60 * 24;

    // Shared strength requirement for every self-service password entry
    // point: at least 8 characters, upper + lower case, and a number.
    private function passwordRules(): array
    {
        return ['required', 'string', PasswordPolicy::rule(), 'confirmed'];
    }

    // Login
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Checked before the credential check: a pending account's password is
        // an unusable, never-disclosed placeholder, so no password attempt for
        // it can ever succeed — without this, the activation hint below would
        // be unreachable and the resident would only ever see a generic
        // "incorrect credentials" error.
        if ($user && $user->status === 'pending') {
            AuditLog::record(
                request: $request,
                action: 'login',
                description: "Login blocked: account not yet activated ({$validated['email']})",
                userId: $user->id,
                userRole: $user->role,
                targetType: 'user',
                targetId: $user->id,
                result: 'failure',
            );

            return response()->json([
                'message' => 'This account has not been activated yet. Please check your email for the activation link.',
            ], 403);
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            AuditLog::record(
                request: $request,
                action: 'login',
                description: "Login failed: incorrect credentials for {$validated['email']}",
                userId: $user?->id,
                userRole: $user?->role,
                targetType: 'user',
                targetId: $user?->id,
                result: 'failure',
            );

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            AuditLog::record(
                request: $request,
                action: 'login',
                description: "Login blocked: account deactivated ({$user->email})",
                userId: $user->id,
                userRole: $user->role,
                targetType: 'user',
                targetId: $user->id,
                result: 'failure',
            );

            return response()->json(['message' => 'This account has been deactivated.',], 403);
        }

        $token = $user->createToken('vms-api-token')->plainTextToken;

        AuditLog::record(
            request: $request,
            action: 'login',
            description: "Login successful: {$user->email}",
            userId: $user->id,
            userRole: $user->role,
            targetType: 'user',
            targetId: $user->id,
            result: 'success',
        );

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    // Logout
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->currentAccessToken()->delete();

        AuditLog::record(
            request: $request,
            action: 'logout',
            description: "Logout: {$user->email}",
            userId: $user->id,
            userRole: $user->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json(['message' => 'Logout successful.',]);
    }

    // Get currently authenticated user (own profile)
    public function user(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user(),]);
    }

    // Activate an admin-created account and set the initial password
    public function activate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => $this->passwordRules(),
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || $user->status !== 'pending') {
            throw ValidationException::withMessages([
                'email' => ['This account is not awaiting activation.'],
            ]);
        }

        $validToken = AccountToken::verify(
            'account_activation_tokens',
            $validated['email'],
            $validated['token'],
            self::ACTIVATION_TOKEN_EXPIRY_MINUTES
        );

        if (!$validToken) {
            throw ValidationException::withMessages([
                'token' => ['This activation link is invalid or has expired.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
            'status' => 'active',
        ]);

        AccountToken::forget('account_activation_tokens', $validated['email']);

        return response()->json([
            'message' => 'Account activated successfully. You can now log in.',
        ]);
    }

    // Request a password reset link
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Always respond the same way, whether or not the account exists,
        // so this endpoint can't be used to enumerate registered emails.
        if ($user && $user->status !== 'inactive') {
            $token = AccountToken::issue('password_reset_tokens', $validated['email']);

            $link = config('app.frontend_url') . '/reset-password?email=' .
                urlencode($validated['email']) . '&token=' . $token;

            Mail::raw(
                "Hello {$user->name},\n\nUse the link below to reset your VMS password. This link expires in "
                . self::RESET_TOKEN_EXPIRY_MINUTES . " minutes.\n\n{$link}\n\n"
                . "If you did not request this, you can safely ignore this email.",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Reset your VMS password');
                }
            );
        }

        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    // Complete a password reset
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => $this->passwordRules(),
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || $user->status === 'inactive') {
            throw ValidationException::withMessages([
                'email' => ['Unable to reset the password for this account.'],
            ]);
        }

        $validToken = AccountToken::verify(
            'password_reset_tokens',
            $validated['email'],
            $validated['token'],
            self::RESET_TOKEN_EXPIRY_MINUTES
        );

        if (!$validToken) {
            throw ValidationException::withMessages([
                'token' => ['This password reset link is invalid or has expired.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
            // A pending account that completes a reset has proven ownership
            // of the email and set a password, so it's now effectively activated.
            'status' => $user->status === 'pending' ? 'active' : $user->status,
        ]);

        AccountToken::forget('password_reset_tokens', $validated['email']);

        AuditLog::record(
            request: $request,
            action: 'password_reset',
            description: "Password reset completed: {$user->email}",
            userId: $user->id,
            userRole: $user->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'Password reset successfully. You can now log in.',
        ]);
    }

    // Change password while logged in
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => $this->passwordRules(),
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        AuditLog::record(
            request: $request,
            action: 'change_password',
            description: "Password changed: {$user->email}",
            userId: $user->id,
            userRole: $user->role,
            targetType: 'user',
            targetId: $user->id,
        );

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
