<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    // Display administrator dashboard statistics
    public function index(): JsonResponse
    {
        $startOfWeek = now()->startOfWeek(\Carbon\Carbon::MONDAY);
        $endOfWeek = $startOfWeek->copy()->addDays(6)->endOfDay();

        // One grouped query for the week's per-day counts, instead of 7 separate queries
        $countsByDate = Visitor::whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $weeklyVolume = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $startOfWeek->copy()->addDays($i);
            $weeklyVolume[] = [
                'label' => substr($day->format('D'), 0, 1),
                'count' => (int) ($countsByDate[$day->toDateString()] ?? 0),
            ];
        }

        // Computed in SQL rather than pulling every checked-in/out row into
        // PHP just to average two timestamps.
        $avgVisitMinutes = Visitor::whereNotNull('checked_in_at')
            ->whereNotNull('checked_out_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, checked_in_at, checked_out_at)) as avg_minutes')
            ->value('avg_minutes');

        // One grouped query for per-status counts, instead of 7 separate queries
        $statusCounts = Visitor::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // One grouped query for resident/guard counts, instead of 2 separate queries
        $roleCounts = User::whereIn('role', ['resident', 'guard'])
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        return response()->json([
            'statistics' => [
                // "Today" always falls within the current week, so reuse that grouped query
                'today' => (int) ($countsByDate[now()->toDateString()] ?? 0),
                'weekly_volume' => $weeklyVolume,
                'avg_visit_minutes' => round($avgVisitMinutes ?? 0, 1),

                'total_visitors' => $statusCounts->sum(),
                'upcoming' => (int) ($statusCounts['upcoming'] ?? 0),
                'checked_in' => (int) ($statusCounts['checked_in'] ?? 0),
                'checked_out' => (int) ($statusCounts['checked_out'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
                'expired' => (int) ($statusCounts['expired'] ?? 0),
                'active_visitors' => (int) ($statusCounts['checked_in'] ?? 0),

                'residents' => (int) ($roleCounts['resident'] ?? 0),
                'guards' => (int) ($roleCounts['guard'] ?? 0),
            ],
        ]);
    }
}
