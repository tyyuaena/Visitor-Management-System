<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $fillable = [
        'code',
        'label',
    ];

    // Matched by the plain "unit" string column on users, not a foreign key —
    // residents are assigned to a unit by its code.
    public function residents(): HasMany
    {
        return $this->hasMany(User::class, 'unit', 'code');
    }
}
