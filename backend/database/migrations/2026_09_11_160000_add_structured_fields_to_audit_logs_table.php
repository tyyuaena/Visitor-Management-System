<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Snapshot of the acting user's role at the time of the action —
            // deliberately not derived from users.role, which can change
            // after the fact (e.g. a later role change would otherwise
            // silently rewrite the meaning of old log entries).
            $table->string('user_role')->nullable()->after('user_id');

            // What kind of record this action affected (e.g. "visitor",
            // "user", "unit"), and its ID — kept separate from the free-text
            // description so entries are queryable by affected record.
            $table->string('target_type')->nullable()->after('description');
            $table->unsignedBigInteger('target_id')->nullable()->after('target_type');

            $table->string('result')->default('success')->after('target_id');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['user_role', 'target_type', 'target_id', 'result']);
        });
    }
};
