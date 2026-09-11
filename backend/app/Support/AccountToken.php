<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Shared helper for the email + token tables used by both the
// account-activation and forgot-password flows (same table shape:
// email primary key, hashed token, created_at).
class AccountToken
{
    // Generate a token, store its hash, and return the plain token to email out
    public static function issue(string $table, string $email): string
    {
        $token = Str::random(64);

        DB::table($table)->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        return $token;
    }

    // Verify a plain token against the stored hash, honoring an expiry window
    public static function verify(string $table, string $email, string $token, int $expiryMinutes): bool
    {
        $record = DB::table($table)->where('email', $email)->first();

        if (!$record || !$record->token) {
            return false;
        }

        if (now()->diffInMinutes($record->created_at) > $expiryMinutes) {
            return false;
        }

        return Hash::check($token, $record->token);
    }

    public static function forget(string $table, string $email): void
    {
        DB::table($table)->where('email', $email)->delete();
    }
}
