<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_succeeds_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'resident@example.com',
            'password' => 'password',
            'role' => 'resident',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_login_fails_with_incorrect_password(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_is_blocked_for_a_pending_account(): void
    {
        // Admin-created accounts start "pending" until the activation link is
        // used — a password attempt against the unusable placeholder must
        // never succeed, and the response must say so distinctly from a
        // plain wrong-credentials error.
        $user = User::factory()->create([
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['message' => 'This account has not been activated yet. Please check your email for the activation link.']);
    }

    public function test_login_is_blocked_for_a_deactivated_account(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['message' => 'This account has been deactivated.']);
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
            'status' => 'active',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Sanctum's guard memoizes the resolved user on itself for the
        // lifetime of the container; within one test method that container
        // persists across these simulated requests, so without this the
        // logout request's own (correct) resolution would be reused here
        // instead of a fresh DB lookup — a testing-harness artifact, not
        // something that happens across real, separate HTTP requests.
        $this->app['auth']->forgetGuards();

        // The now-revoked token must no longer authenticate anything.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/user')
            ->assertStatus(401);
    }

    public function test_forgot_password_gives_the_same_response_for_an_unknown_email(): void
    {
        // Must not leak whether an account exists — the response text and
        // status code should be identical either way.
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nobody-registered@example.com',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'If an account with that email exists, a password reset link has been sent.']);
    }

    public function test_change_password_requires_the_correct_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
            'status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'wrong-current-password',
            'password' => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);

        $response->assertStatus(422);
    }
}
