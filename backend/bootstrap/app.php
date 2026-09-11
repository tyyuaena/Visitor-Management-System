<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        // This app is API-only — there is no "login" web route to redirect
        // guests to. Without this, an unauthenticated request that doesn't
        // send Accept: application/json makes Authenticate::redirectTo()
        // throw RouteNotFoundException trying to resolve route('login'),
        // which then renders as an unrelated 500 with a full stack trace.
        $middleware->redirectGuestsTo(fn () => null);

        // Applies Laravel's built-in "api" rate limiter (60 requests/min
        // per authenticated user, falling back to IP) to every API route.
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Belt-and-braces: even if APP_DEBUG is ever left on in production,
        // never let a raw, unexpected exception (message/file/line/trace)
        // reach an API response. Exceptions that already render a clean,
        // purpose-built response (validation errors, auth/authorization
        // failures, 404s, the rate limiter's 429, etc.) are left alone —
        // only a genuinely unhandled failure gets replaced.
        $exceptions->render(function (\Throwable $e, Request $request) {
            $hasSafeResponse =
                $e instanceof ValidationException ||
                $e instanceof AuthenticationException ||
                $e instanceof AuthorizationException ||
                $e instanceof HttpExceptionInterface;

            if (
                app()->environment('production') &&
                ($request->is('api/*') || $request->expectsJson()) &&
                !$hasSafeResponse
            ) {
                return response()->json([
                    'message' => 'Something went wrong. Please try again later.',
                ], 500);
            }
        });
    })->create();
