<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['host', 'participant'])->default('participant');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'left'])->default('pending');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['study_session_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_participants');
    }
};