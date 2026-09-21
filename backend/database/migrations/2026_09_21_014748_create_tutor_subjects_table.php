<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->enum('proficiency_level', ['intermediate', 'advanced', 'expert'])->default('advanced');
            $table->timestamps();

            $table->unique(['tutor_profile_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_subjects');
    }
};