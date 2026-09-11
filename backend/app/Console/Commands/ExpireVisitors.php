<?php

namespace App\Console\Commands;

use App\Models\Visitor;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('visitors:expire')]
#[Description('Mark upcoming visitor registrations as expired once their expected visit time has passed')]
class ExpireVisitors extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expired = Visitor::where('status', 'upcoming')
            ->where('expected_at', '<', now())
            ->update(['status' => 'expired']);

        $this->info("Marked {$expired} visitor(s) as expired.");

        return self::SUCCESS;
    }
}
