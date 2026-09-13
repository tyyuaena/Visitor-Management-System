<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    // Public, unauthenticated, dependency-light health check for Elastic
    // Beanstalk's load balancer / monitoring to poll.
    //
    // Always returns HTTP 200 so a transient RDS blip doesn't make EB mark
    // an otherwise-healthy instance as unhealthy and cycle it — the
    // "database" field is what should actually be inspected when
    // diagnosing a real outage, not the HTTP status code. No credentials,
    // hostnames, or query details are ever included in the response.
    public function index(): JsonResponse
    {
        $database = 'connected';

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $database = 'unreachable';
        }

        return response()->json([
            'status' => 'ok',
            'database' => $database,
        ]);
    }
}
