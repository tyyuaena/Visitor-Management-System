<?php

namespace Tests\Feature;

use Tests\TestCase;

// Regression test for a real bug caught while verifying this project's AWS
// deployment: GET / previously depended on view('welcome') (500'd on a
// missing Vite manifest), then — after that fix — still 500'd whenever the
// database was unreachable, because every routes/web.php route
// automatically gets Laravel's "web" middleware group, and several of its
// members (StartSession, ShareErrorsFromSession, and Laravel 13's CSRF
// middleware PreventRequestForgery) all touch the database-backed session
// even for a plain GET. Reproduced against a real RDS DNS outage locally.
class RootRouteTest extends TestCase
{
    protected function tearDown(): void
    {
        config(['database.connections.sqlite.database' => ':memory:']);
        parent::tearDown();
    }

    public function test_root_route_survives_an_unreachable_database(): void
    {
        config(['database.connections.sqlite.database' => '/nonexistent/path/does-not-exist.sqlite']);

        $response = $this->getJson('/');

        $response->assertOk()
            ->assertJson(['status' => 'ok']);
    }
}
