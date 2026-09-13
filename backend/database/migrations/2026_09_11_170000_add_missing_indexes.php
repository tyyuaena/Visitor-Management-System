<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->index('status');
            $table->index('unit');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('action');
            $table->index('result');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('unit');
        });
    }

    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['unit']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['action']);
            $table->dropIndex(['result']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['unit']);
        });
    }
};
