<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Unit;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminUnitController extends Controller
{
    // Display all condominium units, each with its assigned residents —
    // doubles as the data source for both unit management and the
    // resident/unit directory view.
    public function index(): JsonResponse
    {
        $units = Unit::with(['residents' => function ($query) {
                $query->select('id', 'name', 'email', 'status', 'unit');
            }])
            ->orderBy('code')
            ->get();

        return response()->json(['units' => $units]);
    }

    // Register a new condominium unit
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:units,code'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $unit = Unit::create($validated);

        AuditLog::record(
            request: $request,
            action: 'create_unit',
            description: 'Added condominium unit: ' . $unit->code,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'unit',
            targetId: $unit->id,
        );

        return response()->json([
            'message' => 'Unit added successfully.',
            'unit' => $unit,
        ], 201);
    }

    // Update a condominium unit. Renaming a unit's code cascades to every
    // resident currently assigned to it, so the directory never orphans a
    // resident against a code that no longer exists.
    public function update(
        Request $request,
        Unit $unit
    ): JsonResponse {

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('units', 'code')->ignore($unit->id)],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $oldCode = $unit->code;

        // The rename itself and both cascaded column updates must all
        // succeed together — if a later step failed after an earlier one
        // committed, users/visitors/units would disagree on the unit code.
        DB::transaction(function () use ($unit, $oldCode, $validated) {
            if ($oldCode !== $validated['code']) {
                User::where('unit', $oldCode)->update(['unit' => $validated['code']]);
                Visitor::where('unit', $oldCode)->update(['unit' => $validated['code']]);
            }

            $unit->update($validated);
        });

        AuditLog::record(
            request: $request,
            action: 'update_unit',
            description: 'Updated condominium unit: ' . $oldCode . ' -> ' . $unit->code,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'unit',
            targetId: $unit->id,
        );

        return response()->json([
            'message' => 'Unit updated successfully.',
            'unit' => $unit->fresh(),
        ]);
    }

    // Remove a condominium unit — blocked while residents are still assigned
    public function destroy(
        Request $request,
        Unit $unit
    ): JsonResponse {

        if ($unit->residents()->exists()) {
            return response()->json([
                'message' => 'Cannot remove a unit that still has residents assigned to it.',
            ], 422);
        }

        $code = $unit->code;
        $unitId = $unit->id;
        $unit->delete();

        AuditLog::record(
            request: $request,
            action: 'delete_unit',
            description: 'Removed condominium unit: ' . $code,
            userId: $request->user()->id,
            userRole: $request->user()->role,
            targetType: 'unit',
            targetId: $unitId,
        );

        return response()->json([
            'message' => 'Unit removed successfully.',
        ]);
    }
}
