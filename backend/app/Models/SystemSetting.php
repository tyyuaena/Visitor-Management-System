<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    // Request-lifetime cache: a single visitor registration can otherwise
    // trigger half a dozen separate single-row lookups (QR expiry, advance
    // booking window, per-day cap, visiting-hours start/end) — one process
    // only ever needs to fetch the whole settings table once.
    private static ?array $cache = null;

    public static function get(string $key, mixed $default = null): mixed
    {
        if (self::$cache === null) {
            self::$cache = static::query()->pluck('value', 'key')->all();
        }

        return self::$cache[$key] ?? $default;
    }

    // Called after any write, so a subsequent read within the same request
    // (or in tests) doesn't see a stale cached value.
    public static function forgetCache(): void
    {
        self::$cache = null;
    }
}
