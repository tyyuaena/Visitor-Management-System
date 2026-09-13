<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    // Actions that are inherently security-relevant (authentication,
    // credential changes, account deactivation, QR trust decisions, and
    // security-config changes) — used to power the "security events" view,
    // distinct from the flat, undifferentiated audit stream.
    private const SECURITY_ACTIONS = [
        'login',
        'logout',
        'change_password',
        'password_reset',
        'admin_reset_password',
        'deactivate_user',
        'verify_qr',
        'revoke_qr',
        'update_system_settings',
    ];

    // Display audit logs
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'action' => ['sometimes', 'string', 'max:100'],
            'search' => ['sometimes', 'string', 'max:255'],
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'user_role' => ['sometimes', 'in:resident,guard,admin'],
            'result' => ['sometimes', 'in:success,failure'],
            'security_only' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $query = AuditLog::with('user');

        // Filter by action
        if ($request->filled('action')) {
            $query->where(
                'action',
                $request->action
            );
        }

        // Search description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(
                'description',
                'like',
                "%{$search}%"
            );
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate(
                'created_at',
                $request->date
            );
        }

        // Filter by acting user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by the acting user's role at the time of the action
        if ($request->filled('user_role')) {
            $query->where('user_role', $request->user_role);
        }

        // Filter by outcome
        if ($request->filled('result')) {
            $query->where('result', $request->result);
        }

        // Security events: either an inherently security-relevant action, or
        // any failed attempt regardless of action type.
        if ($request->boolean('security_only')) {
            $query->where(function ($q) {
                $q->whereIn('action', self::SECURITY_ACTIONS)
                    ->orWhere('result', 'failure');
            });
        }

        // Paginated: this table grows on every login, scan, and admin
        // action, so an unbounded ->get() would only get slower over time.
        $logs = $query
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json([
            'logs' => $logs,
        ]);
    }
}
