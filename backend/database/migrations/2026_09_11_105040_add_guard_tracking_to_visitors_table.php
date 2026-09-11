<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->foreignId('approved_by')->nullable()->after('checked_in_at')->constrained('users')->nullOnDelete();
            $table->foreignId('rejected_by')->nullable()->after('rejection_reason')->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            $table->foreignId('checked_out_by')->nullable()->after('checked_out_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('rejected_by');
            $table->dropColumn('rejected_at');
            $table->dropConstrainedForeignId('checked_out_by');
        });
    }
};
