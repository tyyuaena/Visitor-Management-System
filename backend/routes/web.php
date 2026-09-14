<?php

use Illuminate\Support\Facades\Route;

// The API stays a REST API (routes/api.php, prefix /api) — this file's only
// job is to serve the built React SPA (frontend/dist, copied into public/
// before deploy — see bin/build-frontend.sh) for any non-API path, so
// client-side routes (e.g. /dashboard) resolve to the SPA shell instead of
// a Laravel 404. In production, nginx (.platform/nginx/.../php.conf) serves
// index.html directly and this route is never actually hit; it exists so
// `php artisan serve` (no nginx in front) behaves the same way locally.
//
// withoutMiddleware('web') is required, not cosmetic: every routes/web.php
// route gets Laravel's "web" middleware group automatically, and several of
// its members (StartSession, ShareErrorsFromSession, and — as of Laravel
// 13's CSRF middleware, PreventRequestForgery, even on a GET) all touch the
// database-backed session. This route returns a static file and needs none
// of that — excluding the group means it still works during a DB outage,
// exactly when a client trying to (re)load the app shell matters most.
// EB's health check targets GET /api/health, not this route.
Route::get('/{any?}', function () {
    return response()->file(public_path('index.html'));
})->where('any', '^(?!api).*$')->withoutMiddleware('web');
