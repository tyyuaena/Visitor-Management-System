<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Local/dev runs over plain HTTP; a real deployment sets
        // APP_ENV=production, at which point every generated URL (and any
        // redirect) is forced onto HTTPS.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Backs bootstrap/app.php's throttleApi() — 60 requests/minute per
        // authenticated user, or per IP for unauthenticated requests.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
