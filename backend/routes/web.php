<?php

use Illuminate\Support\Facades\Route;

// This backend is an API-only service — the actual frontend is the separate
// React SPA in /frontend, not the unused Laravel scaffold Blade view. The
// default `view('welcome')` here depended on `@vite(...)` assets that were
// never built in this project, so it would 500 with a
// ViteManifestNotFoundException in production. This route only needs to
// confirm the API is up; it is not the health-check endpoint EB should
// monitor — use GET /api/health for that.
//
// withoutMiddleware('web') is required, not cosmetic: every routes/web.php
// route gets Laravel's "web" middleware group automatically, and several of
// its members (StartSession, ShareErrorsFromSession, and — as of Laravel
// 13's CSRF middleware, PreventRequestForgery, even on a GET) all touch the
// database-backed session. A route with nothing to do with sessions or
// cookies would otherwise 500 whenever the database is briefly unreachable
// — exactly when a simple "is the app up" ping matters most. Excluding the
// group by name (rather than enumerating each member class) also survives
// the framework adding another session-dependent member to "web" later.
// Confirmed by reproducing a real DB outage locally, and by a feature test.
Route::get('/', function () {
    return response()->json([
        'application' => config('app.name'),
        'status' => 'ok',
    ]);
})->withoutMiddleware('web');
