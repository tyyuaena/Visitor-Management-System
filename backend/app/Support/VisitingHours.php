<?php

namespace App\Support;

use App\Models\SystemSetting;

// Shared visiting-hours logic, used both when a resident schedules a visitor
// (registration/edit) and when a guard checks one in at the gate.
class VisitingHours
{
    // [start, end] as "H:i" strings, e.g. ["08:00", "22:00"]
    public static function bounds(): array
    {
        return [
            SystemSetting::where('key', 'visiting_start')->value('value') ?? '08:00',
            SystemSetting::where('key', 'visiting_end')->value('value') ?? '22:00',
        ];
    }

    // $time must be an "H:i"-formatted string
    public static function contains(string $time): bool
    {
        [$start, $end] = self::bounds();

        return $time >= $start && $time <= $end;
    }
}
