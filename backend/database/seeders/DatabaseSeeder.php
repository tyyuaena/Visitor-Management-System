<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * There is no in-app way to create the very first account (all
     * account creation goes through admin-gated routes), so this
     * seeder is the bootstrap path for local development.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@vms.test'],
            [
                'name' => 'System Administrator',
                'password' => 'password',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'guard@vms.test'],
            [
                'name' => 'Security Guard',
                'password' => 'password',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'resident@vms.test'],
            [
                'name' => 'Test Resident',
                'password' => 'password',
                'role' => 'resident',
                'unit' => 'A-12-08',
                'status' => 'active',
            ]
        );
    }
}
