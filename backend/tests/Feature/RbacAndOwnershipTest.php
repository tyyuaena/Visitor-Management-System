<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Visitor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Attacks the authorization layer directly through the API, the way a
// malicious client with a valid token but the wrong role/ownership would —
// not through the UI, which hides buttons but proves nothing about the
// backend. Every case here must be rejected by RoleMiddleware or
// VisitorPolicy regardless of what the frontend would have shown.
class RbacAndOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_to_a_protected_route_is_rejected(): void
    {
        $this->getJson('/api/resident/visitors')->assertStatus(401);
    }

    public function test_resident_cannot_view_another_residents_visitor(): void
    {
        $owner = User::factory()->create(['role' => 'resident']);
        $attacker = User::factory()->create(['role' => 'resident']);
        $visitor = $this->makeVisitor($owner);

        $this->actingAs($attacker, 'sanctum')
            ->getJson("/api/resident/visitors/{$visitor->id}")
            ->assertStatus(403);
    }

    public function test_resident_cannot_edit_another_residents_visitor(): void
    {
        $owner = User::factory()->create(['role' => 'resident']);
        $attacker = User::factory()->create(['role' => 'resident']);
        $visitor = $this->makeVisitor($owner);

        $this->actingAs($attacker, 'sanctum')
            ->putJson("/api/resident/visitors/{$visitor->id}", [
                'name' => 'Tampered Name',
                'phone' => '0123456789',
                'purpose' => 'Tampered',
                'expected_at' => now()->addDay()->format('Y-m-d H:i:s'),
            ])
            ->assertStatus(403);

        $this->assertDatabaseHas('visitors', [
            'id' => $visitor->id,
            'name' => $visitor->name, // unchanged
        ]);
    }

    public function test_resident_cannot_cancel_another_residents_visitor(): void
    {
        $owner = User::factory()->create(['role' => 'resident']);
        $attacker = User::factory()->create(['role' => 'resident']);
        $visitor = $this->makeVisitor($owner);

        $this->actingAs($attacker, 'sanctum')
            ->deleteJson("/api/resident/visitors/{$visitor->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('visitors', [
            'id' => $visitor->id,
            'status' => 'upcoming', // unchanged
        ]);
    }

    public function test_resident_cannot_access_guard_only_routes(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $visitor = $this->makeVisitor($resident);

        $this->actingAs($resident, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => 'anything'])
            ->assertStatus(403);

        $this->actingAs($resident, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/approve")
            ->assertStatus(403);
    }

    public function test_resident_cannot_access_admin_only_routes(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);

        $this->actingAs($resident, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertStatus(403);

        $this->actingAs($resident, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_guard_cannot_access_resident_only_routes(): void
    {
        $guard = User::factory()->create(['role' => 'guard']);

        $this->actingAs($guard, 'sanctum')
            ->postJson('/api/resident/visitors', [
                'name' => 'X', 'phone' => '0123456789', 'purpose' => 'Y',
                'expected_at' => now()->addDay()->format('Y-m-d H:i:s'),
            ])
            ->assertStatus(403);
    }

    public function test_guard_cannot_access_admin_only_routes(): void
    {
        $guard = User::factory()->create(['role' => 'guard']);

        $this->actingAs($guard, 'sanctum')
            ->getJson('/api/admin/audit-logs')
            ->assertStatus(403);

        $this->actingAs($guard, 'sanctum')
            ->putJson('/api/admin/settings', [])
            ->assertStatus(403);
    }

    public function test_admin_cannot_access_guard_only_scan_route(): void
    {
        // Confirms role checks are exact-match, not "admin can do anything" —
        // admin has its own oversight endpoints instead.
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => 'anything'])
            ->assertStatus(403);
    }

    public function test_resident_cannot_promote_their_own_role_via_mass_assignment(): void
    {
        // The visitor-registration payload isn't where role escalation would
        // even be attempted in this app (residents don't self-edit their own
        // user record), but confirm the resident record truly can't be
        // touched by a resident-role request at all.
        $resident = User::factory()->create(['role' => 'resident']);

        $this->actingAs($resident, 'sanctum')
            ->putJson("/api/admin/users/{$resident->id}", [
                'name' => $resident->name,
                'email' => $resident->email,
                'status' => 'active',
                'role' => 'admin',
            ])
            ->assertStatus(403);

        $this->assertDatabaseHas('users', [
            'id' => $resident->id,
            'role' => 'resident',
        ]);
    }

    private function makeVisitor(User $resident): Visitor
    {
        return Visitor::create([
            'resident_id' => $resident->id,
            'name' => 'Test Visitor',
            'phone' => '0123456789',
            'purpose' => 'Delivery',
            'unit' => $resident->unit,
            'expected_at' => now()->addDay(),
            'status' => 'upcoming',
            'qr_token' => bin2hex(random_bytes(32)),
            'qr_expires_at' => now()->addHours(24),
        ]);
    }
}
