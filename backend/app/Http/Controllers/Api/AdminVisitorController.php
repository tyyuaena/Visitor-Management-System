<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVisitorController extends Controller
{
    // Display all visitor records
    public function index(
        Request $request
    ): JsonResponse {

        $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:upcoming,checked_in,checked_out,cancelled,expired,rejected'],
            'resident_id' => ['sometimes', 'integer', 'exists:users,id'],
            'unit' => ['sometimes', 'string', 'max:50'],
            'guard_id' => ['sometimes', 'integer', 'exists:users,id'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
        ]);

        $query = Visitor::with(['resident', 'approver', 'rejector', 'checkoutGuard']);

        // Search visitor name / phone
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where(
                    'name',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'phone',
                    'like',
                    "%{$search}%"
                );
            });
        }

        // Filter status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter resident
        if ($request->filled('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        // Filter unit
        if ($request->filled('unit')) {
            $query->where('unit', $request->unit);
        }

        // Filter guard — matches a visitor this guard was involved with in
        // any capacity (approved, rejected, or checked out)
        if ($request->filled('guard_id')) {
            $guardId = $request->guard_id;
            $query->where(function ($q) use ($guardId) {
                $q->where('approved_by', $guardId)
                    ->orWhere('rejected_by', $guardId)
                    ->orWhere('checked_out_by', $guardId);
            });
        }

        // Filter start date
        if ($request->filled('from')) {
            $query->whereDate('expected_at', '>=', $request->from);
        }

        // Filter end date
        if ($request->filled('to')) {
            $query->whereDate('expected_at', '<=', $request->to);
        }

        $visitors = $query
            ->orderByDesc('expected_at')
            ->get();

        return response()->json([
            'visitors' => $visitors,
        ]);
    }
}
