<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    // Display system settings
    public function index(): JsonResponse
    {
        // Same request-lifetime-cached lookup the rest of the app uses
        // (VisitorController, VisitingHours) — provides the same defaults
        // if settings do not exist yet.
        return response()->json([
            'settings' => [
                'qr_expiry_hours' => (int) SystemSetting::get('qr_expiry_hours', 24),
                'visiting_start' => SystemSetting::get('visiting_start', '08:00'),
                'visiting_end' => SystemSetting::get('visiting_end', '22:00'),
                'max_advance_booking_days' => (int) SystemSetting::get('max_advance_booking_days', 30),
                'max_visitors_per_day' => (int) SystemSetting::get('max_visitors_per_day', 10),
            ],
        ]);
    }


    // Update system settings
    public function update(
        Request $request
    ): JsonResponse {

        $validated = $request->validate([
            'qr_expiry_hours' => ['required', 'integer', 'min:1', 'max:168',],
            'visiting_start' => ['required', 'date_format:H:i',],
            'visiting_end' => ['required', 'date_format:H:i',],
            'max_advance_booking_days' => ['required', 'integer', 'min:1', 'max:365',],
            'max_visitors_per_day' => ['required', 'integer', 'min:1', 'max:100',],
        ]);

        // Make sure visiting start is before visiting end
        if (
            $validated['visiting_start'] >= $validated['visiting_end']
        ) {
            return response()->json([
                'message' => 'Visiting start time must be earlier than visiting end time.',
            ], 422);
        }

        // Save settings
        foreach ($validated as $key => $value) {
            SystemSetting::updateOrCreate(
                [ 'key' => $key, ],
                [ 'value' => $value, ]
            );
        }

        // Invalidate the request-lifetime settings cache so anything reading
        // settings later in this same request sees the new values.
        SystemSetting::forgetCache();

        // Record audit log
        AuditLog::record(
            request: $request,
            action: 'update_system_settings',
            description: 'Updated QR expiry, visiting-hour, and registration-rule settings.',
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'system_setting',
        );

        return response()->json([
            'message' => 'System settings updated successfully.',
            'settings' => $validated,
        ]);
    }
}