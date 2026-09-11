<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visitor;

class VisitorPolicy
{
    // Determine whether the user can view the visitor
    public function view(
        User $user,
        Visitor $visitor
    ): bool {
        return $visitor->resident_id === $user->id;
    }

    // Determine whether the user can update the visitor
    public function update(
        User $user,
        Visitor $visitor
    ): bool {
        return $visitor->resident_id === $user->id && $visitor->status === 'upcoming';
    }

    // Determine whether the user can cancel the visitor
    public function delete(
        User $user,
        Visitor $visitor
    ): bool {
        return $visitor->resident_id === $user->id && $visitor->status === 'upcoming';
    }
}