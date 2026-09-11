<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


use App\Http\Controllers\Api\AuthController;

Route::prefix('auth')->group(function () {
    // Credential/token-guessing endpoints get a tighter limit than the
    // general API throttle, since these are the ones brute-forcing matters
    // for.
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/activate', [AuthController::class, 'activate']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware(['auth:sanctum', 'role:resident'])
    ->get('/resident-test', function (Request $request) {
        return response()->json([
            'message' => 'Resident access granted.',
            'user' => $request->user(),
        ]);
    });

Route::middleware(['auth:sanctum', 'role:guard'])
    ->get('/guard-test', function (Request $request) {
        return response()->json([
            'message' => 'Guard access granted.',
            'user' => $request->user(),
        ]);
    });

Route::middleware(['auth:sanctum', 'role:admin'])
    ->get('/admin-test', function (Request $request) {
        return response()->json([
            'message' => 'Administrator access granted.',
            'user' => $request->user(),
        ]);
    });


use App\Http\Controllers\Api\VisitorController;

Route::middleware(['auth:sanctum', 'role:resident'])
    ->prefix('resident')
    ->group(function () {

        Route::get('/visitors', [VisitorController::class, 'index']);
        Route::post('/visitors', [VisitorController::class, 'store']);
        Route::get('/visitors/{visitor}', [VisitorController::class, 'show']);
        Route::put('/visitors/{visitor}', [VisitorController::class, 'update']);
        Route::delete('/visitors/{visitor}', [VisitorController::class, 'destroy']);
        Route::get('/visitors/{visitor}/qr', [VisitorController::class, 'qr']);
        Route::post('/visitors/{visitor}/qr/regenerate', [VisitorController::class, 'regenerateQr']);
    });


use App\Http\Controllers\Api\GuardController;

Route::middleware(['auth:sanctum', 'role:guard'])
    ->prefix('guard')
    ->group(function () {

        // Generous enough for legitimate rapid scanning at the gate, but
        // still bounds how fast a guard's authenticated session could be
        // used to brute-force token guesses.
        Route::post('/verify-qr', [GuardController::class, 'verifyQr'])->middleware('throttle:30,1');
        Route::post('/visitors/{visitor}/approve', [GuardController::class, 'approve']);
        Route::post('/visitors/{visitor}/reject', [GuardController::class, 'reject']);
        Route::post('/visitors/{visitor}/checkout', [GuardController::class, 'checkout']);
        Route::get('/visitor-logs', [GuardController::class, 'visitorLogs']);
        Route::get('/verification-attempts', [GuardController::class, 'recentAttempts']);
    });


use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminVisitorController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminAuditLogController;
use App\Http\Controllers\Api\AdminSettingsController;
use App\Http\Controllers\Api\AdminUnitController;

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // User Management
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
    Route::post('/admin/users/{user}/resend-activation', [AdminUserController::class, 'resendActivation']);
    Route::post('/admin/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);

    // Unit Management
    Route::get('/admin/units', [AdminUnitController::class, 'index']);
    Route::post('/admin/units', [AdminUnitController::class, 'store']);
    Route::put('/admin/units/{unit}', [AdminUnitController::class, 'update']);
    Route::delete('/admin/units/{unit}', [AdminUnitController::class, 'destroy']);

    // Visitor Oversight
    Route::get('/admin/visitors', [AdminVisitorController::class, 'index']);

    // Dashboard
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);

    // Audit Logs
    Route::get('/admin/audit-logs', [AdminAuditLogController::class, 'index']);

    // System Settings
    Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
    Route::put('/admin/settings', [AdminSettingsController::class, 'update']);
});
