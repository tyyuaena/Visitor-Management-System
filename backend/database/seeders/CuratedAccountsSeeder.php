<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// A second, more realistic-looking set of demo accounts (real-sounding
// names instead of "Resident One") for presentations/screenshots —
// separate from DemoAccountsSeeder so both can coexist. Also seeds a
// visitor per resident (and the audit trail their lifecycle would have
// produced) so logging in as any of these accounts shows real activity
// instead of empty "No visitor records found" screens. Run with:
// php artisan db:seed --class=CuratedAccountsSeeder
class CuratedAccountsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Residents need a real unit row to show correctly in Admin > Units'
        // directory, not just a free-text value on the user — only 3
        // existed (A-01-01, A-01-02, B-02-02), so two more are added here
        // for the extra residents below.
        foreach (['C-03-01', 'C-03-02'] as $code) {
            DB::table('units')->insertOrIgnore([
                'code' => $code,
                'label' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        User::firstOrCreate(
            ['email' => 'tyyuaena@gmail.com'],
            [
                'name' => 'Yun Yi Tan',
                'password' => 'tyyuaena',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'sarah.lim@gmail.com'],
            [
                'name' => 'Sarah Lim',
                'password' => 'adminSarah1',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'daniel.wong@gmail.com'],
            [
                'name' => 'Daniel Wong',
                'password' => 'guardDaniel1',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'ahmad.rahman@gmail.com'],
            [
                'name' => 'Ahmad Rahman',
                'password' => 'guardAhmad1',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'farah.ismail@gmail.com'],
            [
                'name' => 'Farah Ismail',
                'password' => 'guardFarah1',
                'role' => 'guard',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'mei.chen@gmail.com'],
            [
                'name' => 'Mei Chen',
                'password' => 'residentMei1',
                'role' => 'resident',
                'unit' => 'A-01-01',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'kumar.raj@gmail.com'],
            [
                'name' => 'Kumar Raj',
                'password' => 'residentKumar1',
                'role' => 'resident',
                'unit' => 'A-01-02',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'nurul.aisyah@gmail.com'],
            [
                'name' => 'Nurul Aisyah',
                'password' => 'residentNurul1',
                'role' => 'resident',
                'unit' => 'B-02-02',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'james.tan@gmail.com'],
            [
                'name' => 'James Tan',
                'password' => 'residentJames1',
                'role' => 'resident',
                'unit' => 'C-03-01',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'priya.devi@gmail.com'],
            [
                'name' => 'Priya Devi',
                'password' => 'residentPriya1',
                'role' => 'resident',
                'unit' => 'C-03-02',
                'status' => 'active',
            ]
        );

        $this->seedVisitors();
    }

    // Two visitors per curated resident, spread across every status the app
    // actually produces (see GuardController@approve/reject/checkout and
    // VisitorController@destroy for the exact field combinations each one
    // leaves behind — duplicated here so seeded rows are indistinguishable
    // from ones the real workflow would have created). Guarded by a
    // qr_token check per visitor (unique + not null) instead of firstOrCreate
    // (name isn't unique) so re-running this seeder doesn't duplicate them.
    private function seedVisitors(): void
    {
        $residentId = fn (string $email) => User::where('email', $email)->value('id');
        $guardId = fn (string $email) => User::where('email', $email)->value('id');

        $mei = $residentId('mei.chen@gmail.com');
        $kumar = $residentId('kumar.raj@gmail.com');
        $nurul = $residentId('nurul.aisyah@gmail.com');
        $james = $residentId('james.tan@gmail.com');
        $priya = $residentId('priya.devi@gmail.com');

        $daniel = $guardId('daniel.wong@gmail.com');
        $ahmad = $guardId('ahmad.rahman@gmail.com');
        $farah = $guardId('farah.ismail@gmail.com');

        $visitors = [
            // Mei Chen (A-01-01)
            [
                'resident_id' => $mei, 'unit' => 'A-01-01',
                'name' => 'David Lee', 'phone' => '012-345 6789', 'purpose' => 'Guest Visit',
                'expected_at' => now()->addDay()->setTime(10, 0),
                'status' => 'upcoming',
                'qr_expires_at' => now()->addHours(24),
                'created_at' => now()->subHours(2),
            ],
            [
                'resident_id' => $mei, 'unit' => 'A-01-01',
                'name' => 'Grace Wong', 'phone' => '019-876 5432', 'purpose' => 'Food Delivery',
                'expected_at' => now()->subDays(3)->setTime(14, 0),
                'status' => 'checked_out',
                'qr_expires_at' => now()->subDays(2)->setTime(14, 0),
                'qr_used_at' => now()->subDays(3)->setTime(14, 5),
                'checked_in_at' => now()->subDays(3)->setTime(14, 5),
                'approved_by' => $daniel,
                'checked_out_at' => now()->subDays(3)->setTime(16, 30),
                'checked_out_by' => $daniel,
                'created_at' => now()->subDays(4),
            ],

            // Kumar Raj (A-01-02)
            [
                'resident_id' => $kumar, 'unit' => 'A-01-02',
                'name' => 'Suresh Nair', 'phone' => '016-222 3344', 'purpose' => 'Maintenance / Repair',
                'expected_at' => now()->subHour(),
                'status' => 'checked_in',
                'qr_expires_at' => now()->addHours(23),
                'qr_used_at' => now()->subMinutes(50),
                'checked_in_at' => now()->subMinutes(50),
                'approved_by' => $ahmad,
                'created_at' => now()->subDay(),
            ],
            [
                'resident_id' => $kumar, 'unit' => 'A-01-02',
                'name' => 'Anita Rao', 'phone' => '013-555 7788', 'purpose' => 'Service Provider',
                'expected_at' => now()->subDays(2)->setTime(11, 0),
                'status' => 'rejected',
                'qr_expires_at' => now()->subDays(1)->setTime(11, 0),
                'rejection_reason' => 'Visitor not on the approved list',
                'rejected_by' => $ahmad,
                'rejected_at' => now()->subDays(2)->setTime(11, 10),
                'created_at' => now()->subDays(3),
            ],

            // Nurul Aisyah (B-02-02)
            [
                'resident_id' => $nurul, 'unit' => 'B-02-02',
                'name' => 'Faizal Hakim', 'phone' => '017-444 9900', 'purpose' => 'Guest Visit',
                'expected_at' => now()->addDays(2)->setTime(15, 0),
                'status' => 'upcoming',
                'qr_expires_at' => now()->addHours(24),
                'created_at' => now()->subHour(),
            ],
            [
                'resident_id' => $nurul, 'unit' => 'B-02-02',
                'name' => 'Siti Khadijah', 'phone' => '014-321 6540', 'purpose' => 'Delivery',
                'expected_at' => now()->addDay()->setTime(9, 0),
                'status' => 'cancelled',
                'qr_expires_at' => now()->addHours(24),
                'qr_revoked_at' => now()->subHours(3),
                'created_at' => now()->subDay(),
            ],

            // James Tan (C-03-01)
            [
                'resident_id' => $james, 'unit' => 'C-03-01',
                'name' => 'Michael Ong', 'phone' => '011-678 1234', 'purpose' => 'Ride-Hailing Pickup/Drop-off',
                'expected_at' => now()->subDays(2)->setTime(18, 0),
                'status' => 'checked_out',
                'qr_expires_at' => now()->subDays(1)->setTime(18, 0),
                'qr_used_at' => now()->subDays(2)->setTime(18, 5),
                'checked_in_at' => now()->subDays(2)->setTime(18, 5),
                'approved_by' => $farah,
                'checked_out_at' => now()->subDays(2)->setTime(19, 15),
                'checked_out_by' => $farah,
                'created_at' => now()->subDays(3),
            ],
            [
                'resident_id' => $james, 'unit' => 'C-03-01',
                'name' => 'Lisa Koh', 'phone' => '018-990 1122', 'purpose' => 'Moving In/Out',
                'expected_at' => now()->subDays(2)->setTime(10, 0),
                'status' => 'expired',
                'qr_expires_at' => now()->subDay()->setTime(10, 0),
                'created_at' => now()->subDays(3),
            ],

            // Priya Devi (C-03-02)
            [
                'resident_id' => $priya, 'unit' => 'C-03-02',
                'name' => 'Ravi Shankar', 'phone' => '019-333 4455', 'purpose' => 'Guest Visit',
                'expected_at' => now()->addDay()->setTime(11, 0),
                'status' => 'upcoming',
                'qr_expires_at' => now()->addHours(24),
                'created_at' => now()->subMinutes(30),
            ],
            [
                'resident_id' => $priya, 'unit' => 'C-03-02',
                'name' => 'Deepa Menon', 'phone' => '012-111 2233', 'purpose' => 'Service Provider',
                'expected_at' => now()->subMinutes(40),
                'status' => 'checked_in',
                'qr_expires_at' => now()->addHours(23),
                'qr_used_at' => now()->subMinutes(30),
                'checked_in_at' => now()->subMinutes(30),
                'approved_by' => $farah,
                'created_at' => now()->subHours(2),
            ],
        ];

        foreach ($visitors as $visitor) {
            $exists = DB::table('visitors')
                ->where('resident_id', $visitor['resident_id'])
                ->where('name', $visitor['name'])
                ->exists();

            if ($exists) {
                continue;
            }

            $visitor['qr_token'] = Str::random(64);
            $visitor['updated_at'] = $visitor['created_at'];

            $visitorId = DB::table('visitors')->insertGetId($visitor);

            $this->logVisitorLifecycle($visitor, $visitorId);
        }
    }

    // Mirrors the audit trail each status in $visitors would have produced
    // via the real endpoints (VisitorController@store/destroy,
    // GuardController@approve/reject/checkout), so Admin > Audit Logs and
    // the dashboard's activity feed aren't empty either.
    private function logVisitorLifecycle(array $visitor, int $visitorId): void
    {
        $subject = "{$visitor['name']} (unit {$visitor['unit']})";
        $resident = User::find($visitor['resident_id']);

        $entries = [[
            'user_id' => $resident->id,
            'user_role' => 'resident',
            'action' => 'register_visitor',
            'description' => "Registered visitor: {$subject}",
            'created_at' => $visitor['created_at'],
        ]];

        if (in_array($visitor['status'], ['checked_in', 'checked_out'], true)) {
            $entries[] = [
                'user_id' => $visitor['approved_by'],
                'user_role' => 'guard',
                'action' => 'approve_visitor',
                'description' => "Approved entry and checked in visitor: {$subject}",
                'created_at' => $visitor['checked_in_at'],
            ];
        }

        if ($visitor['status'] === 'checked_out') {
            $entries[] = [
                'user_id' => $visitor['checked_out_by'],
                'user_role' => 'guard',
                'action' => 'checkout_visitor',
                'description' => "Checked out visitor: {$subject}",
                'created_at' => $visitor['checked_out_at'],
            ];
        }

        if ($visitor['status'] === 'rejected') {
            $entries[] = [
                'user_id' => $visitor['rejected_by'],
                'user_role' => 'guard',
                'action' => 'reject_visitor',
                'description' => "Rejected entry for visitor: {$subject}. Reason: {$visitor['rejection_reason']}",
                'created_at' => $visitor['rejected_at'],
            ];
        }

        if ($visitor['status'] === 'cancelled') {
            $entries[] = [
                'user_id' => $resident->id,
                'user_role' => 'resident',
                'action' => 'cancel_visitor',
                'description' => "Cancelled visitor registration: {$subject}",
                'created_at' => $visitor['qr_revoked_at'],
            ];
        }

        foreach ($entries as $entry) {
            DB::table('audit_logs')->insert($entry + [
                'target_type' => 'visitor',
                'target_id' => $visitorId,
                'result' => 'success',
                'ip_address' => null,
                'user_agent' => null,
                'updated_at' => $entry['created_at'],
            ]);
        }
    }
}
