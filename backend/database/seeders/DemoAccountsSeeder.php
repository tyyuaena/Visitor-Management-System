<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

// Accounts for live/presentation demos — not the local dev bootstrap accounts
// in DatabaseSeeder. Run with: php artisan db:seed --class=DemoAccountsSeeder
class DemoAccountsSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'resident1@gmail.com'],
            [
                'name' => 'Resident One',
                'password' => 'resident1',
                'role' => 'resident',
                'unit' => 'A-01-01',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'resident2@gmail.com'],
            [
                'name' => 'Resident Two',
                'password' => 'resident2',
                'role' => 'resident',
                'unit' => 'A-01-02',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'guard1@gmail.com'],
            [
                'name' => 'Guard One',
                'password' => 'guard1',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'guard2@gmail.com'],
            [
                'name' => 'Guard Two',
                'password' => 'guard2',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin1@gmail.com'],
            [
                'name' => 'Admin One',
                'password' => 'admin1',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin2@gmail.com'],
            [
                'name' => 'Admin Two',
                'password' => 'admin2',
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }
}
