<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('phone', 30);
            $table->string('purpose');
            $table->dateTime('expected_at');
            $table->string('status')
                ->default('upcoming');
            $table->string('qr_token', 64)
                ->nullable()
                ->unique();
            $table->dateTime('qr_expires_at')
                ->nullable();
            $table->dateTime('qr_revoked_at')
                ->nullable();
            $table->dateTime('qr_used_at')
                ->nullable();
            $table->dateTime('checked_in_at')
                ->nullable();
            $table->dateTime('checked_out_at')
                ->nullable();
            $table->string('rejection_reason')
                ->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};