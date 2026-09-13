<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Visitor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

// Exercises the full Resident -> Guard QR chain end to end, plus every
// rejection path GuardController::verifyQr independently re-checks (it
// never trusts anything from the scanned string beyond the token itself).
class QrLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Pinned inside default visiting hours (08:00-22:00) so registration
        // and scan-time checks are deterministic regardless of when the test
        // suite actually runs.
        Carbon::setTestNow('2026-01-06 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_full_valid_qr_lifecycle_register_scan_approve_checkout(): void
    {
        $resident = User::factory()->create(['role' => 'resident', 'unit' => 'A-01-01']);
        $guard = User::factory()->create(['role' => 'guard']);

        $registerResponse = $this->actingAs($resident, 'sanctum')
            ->postJson('/api/resident/visitors', [
                'name' => 'Jane Visitor',
                'phone' => '0123456789',
                'purpose' => 'Meeting',
                'expected_at' => '2026-01-06 11:00:00',
            ]);

        $registerResponse->assertCreated();
        $visitorId = $registerResponse->json('visitor.id');
        $qrToken = $registerResponse->json('visitor.qr_token');
        $this->assertNotEmpty($qrToken);

        // Guard scans — must independently validate, not trust anything the
        // resident's own request set.
        $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => "VMS-{$qrToken}"])
            ->assertOk()
            ->assertJson(['valid' => true])
            ->assertJsonPath('visitor.id', $visitorId);

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitorId}/approve")
            ->assertOk()
            ->assertJsonPath('visitor.status', 'checked_in');

        $this->assertDatabaseHas('visitors', [
            'id' => $visitorId,
            'status' => 'checked_in',
            'approved_by' => $guard->id,
        ]);

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitorId}/checkout")
            ->assertOk()
            ->assertJsonPath('visitor.status', 'checked_out');

        $this->assertDatabaseHas('visitors', [
            'id' => $visitorId,
            'status' => 'checked_out',
            'checked_out_by' => $guard->id,
        ]);
    }

    public function test_already_used_qr_is_rejected_on_second_scan(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident);

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/approve")
            ->assertOk();

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => "VMS-{$visitor->qr_token}"]);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'already_checked_in']);
    }

    public function test_second_approve_attempt_is_rejected_not_double_processed(): void
    {
        // Simulates two guards (or a double-tap) both trying to approve the
        // same visitor — only the first may succeed.
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident);

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/approve")
            ->assertOk();

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/approve")
            ->assertStatus(422);
    }

    public function test_expired_qr_is_rejected(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident, [
            'qr_expires_at' => Carbon::now()->subHour(),
        ]);

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => "VMS-{$visitor->qr_token}"]);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'expired_qr']);
    }

    public function test_revoked_qr_is_rejected_after_cancellation(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident);

        $this->actingAs($resident, 'sanctum')
            ->deleteJson("/api/resident/visitors/{$visitor->id}")
            ->assertOk();

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => "VMS-{$visitor->qr_token}"]);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'revoked_qr']);
    }

    public function test_malformed_qr_string_is_rejected(): void
    {
        $guard = User::factory()->create(['role' => 'guard']);

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => 'not-a-valid-format']);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'invalid_qr']);
    }

    public function test_nonexistent_qr_token_is_rejected(): void
    {
        $guard = User::factory()->create(['role' => 'guard']);

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => 'VMS-' . bin2hex(random_bytes(32))]);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'not_registered']);
    }

    public function test_qr_scanned_outside_visiting_hours_is_rejected(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident);

        // Registration happened at 10:00 (within hours); the scan attempt
        // happens later the same day, outside the default 08:00-22:00 window.
        Carbon::setTestNow('2026-01-06 23:30:00');

        $response = $this->actingAs($guard, 'sanctum')
            ->postJson('/api/guard/verify-qr', ['qr_token' => "VMS-{$visitor->qr_token}"]);

        $response->assertStatus(422)
            ->assertJsonFragment(['reason' => 'outside_visiting_hours']);
    }

    public function test_reject_records_reason_and_blocks_further_approval(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $guard = User::factory()->create(['role' => 'guard']);
        $visitor = $this->makeVisitor($resident);

        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/reject", ['reason' => 'Information mismatch'])
            ->assertOk()
            ->assertJsonPath('visitor.status', 'rejected');

        // A rejected registration must not then be approvable.
        $this->actingAs($guard, 'sanctum')
            ->postJson("/api/guard/visitors/{$visitor->id}/approve")
            ->assertStatus(422);
    }

    private function makeVisitor(User $resident, array $overrides = []): Visitor
    {
        return Visitor::create(array_merge([
            'resident_id' => $resident->id,
            'name' => 'Test Visitor',
            'phone' => '0123456789',
            'purpose' => 'Delivery',
            'unit' => $resident->unit,
            'expected_at' => Carbon::now()->addHour(),
            'status' => 'upcoming',
            'qr_token' => bin2hex(random_bytes(32)),
            'qr_expires_at' => Carbon::now()->addHours(24),
        ], $overrides));
    }
}
