<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_role',
        'action',
        'description',
        'target_type',
        'target_id',
        'result',
        'ip_address',
        'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Every audit-log write in the app goes through here, so every record
    // consistently carries a role snapshot, target reference, and outcome —
    // not just an ad-hoc free-text description.
    public static function record(
        Request $request,
        string $action,
        string $description,
        ?int $userId = null,
        ?string $userRole = null,
        ?string $targetType = null,
        ?int $targetId = null,
        string $result = 'success',
    ): self {
        return static::create([
            'user_id' => $userId,
            'user_role' => $userRole,
            'action' => $action,
            'description' => $description,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'result' => $result,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
