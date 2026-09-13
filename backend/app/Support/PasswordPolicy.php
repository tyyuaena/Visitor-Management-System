<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

// The one place the app's password-strength requirement (min 8 chars, mixed
// case, at least one number) is defined. AuthController and
// AdminUserController each wrap this in a different set of surrounding
// rules (self-service entry points require password_confirmation; the
// admin-creates-a-guard form does not, since its frontend has no
// confirmation field) — only the strength policy itself needs to be shared.
class PasswordPolicy
{
    public static function rule(): Password
    {
        return Password::min(8)->mixedCase()->numbers();
    }
}
