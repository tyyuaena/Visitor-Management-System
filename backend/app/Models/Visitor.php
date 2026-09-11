<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visitor extends Model
{
    use HasFactory;

    // Computed alongside the raw QR timestamp columns whenever a visitor is serialized
    protected $appends = ['qr_status'];

    protected $fillable = [
        'resident_id',
        'name',
        'phone',
        'purpose',
        'unit',
        'expected_at',
        'status',
        'qr_token',
        'qr_expires_at',
        'qr_revoked_at',
        'qr_used_at',
        'checked_in_at',
        'checked_out_at',
        'rejection_reason',
        'approved_by',
        'rejected_by',
        'rejected_at',
        'checked_out_by',
    ];

    protected function casts(): array
    {
        return [
            'expected_at' => 'datetime',
            'qr_expires_at' => 'datetime',
            'qr_revoked_at' => 'datetime',
            'qr_used_at' => 'datetime',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    // Named to avoid colliding with the raw approved_by/rejected_by/checked_out_by
    // FK columns: Eloquent's array/JSON serialization snake_cases relation method
    // names, so a relation called approvedBy() would serialize to the same
    // "approved_by" key as the column itself and silently overwrite the plain
    // ID with the nested user object.
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function checkoutGuard(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    // Derived QR status: Active / Used / Expired / Revoked
    protected function qrStatus(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->qr_token) {
                    return null;
                }

                if ($this->qr_revoked_at) {
                    return 'revoked';
                }

                if ($this->qr_used_at) {
                    return 'used';
                }

                if ($this->qr_expires_at && $this->qr_expires_at->isPast()) {
                    return 'expired';
                }

                return 'active';
            },
        );
    }
}