<?php

// Explicit CORS config — without this file, Laravel falls back to the
// framework's package default (allowed_origins: ['*']), which accepts
// cross-origin API requests from any site. Since this app is a single
// known SPA (not a public API), origins are restricted to FRONTEND_URL.
return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Auth uses Sanctum bearer tokens (Authorization header), not cookies,
    // so credentialed cross-origin requests are not needed.
    'supports_credentials' => false,

];
