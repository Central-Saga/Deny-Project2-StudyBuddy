<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->enum('type', ['learning', 'teaching']);
            $table->timestamps();

            $table->unique(['user_id', 'subject_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_subjects');
    }
};