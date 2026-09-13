<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// visitors.resident_id was cascadeOnDelete, meaning a hard-deleted User
// would silently erase their entire visitor history — the wrong policy for
// a system whose purpose is keeping an audit trail. The app never hard-
// deletes users (accounts are deactivated via a status flip instead), so
// this only matters as a safety net against a future accidental delete.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropForeign(['resident_id']);
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->foreign('resident_id')
                ->references('id')->on('users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropForeign(['resident_id']);
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->foreign('resident_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();
        });
    }
};
