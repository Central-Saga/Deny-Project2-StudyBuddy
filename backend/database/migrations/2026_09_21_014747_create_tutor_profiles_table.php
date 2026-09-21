<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->decimal('hourly_rate', 10, 2)->default(0.00); // 0.00 = Gratis / Sukarela
            $table->boolean('is_verified')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->decimal('rating_avg', 3, 2)->default(0.00);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_profiles');
    }
};