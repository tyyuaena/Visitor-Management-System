<?php

use Illuminate\Support\Facades\Route;

// This backend is an API-only service — the actual frontend is the separate
// React SPA in /frontend, not the unused Laravel scaffold Blade view. The
// default `view('welcome')` here depended on `@vite(...)` assets that are
// never built in this project (see resources/js|css — leftover scaffold),
// so it would 500 with a ViteManifestNotFoundException in production. This
// route only needs to confirm the API is up; it is not the health-check
// endpoint EB should monitor — use GET /api/health for that.
Route::get('/', function () {
    return response()->json([
        'application' => config('app.name'),
        'status' => 'ok',
    ]);
});
