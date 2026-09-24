<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutoring_reviews', function (Blueprint $table) {
            $table->unique(
                'tutoring_request_id',
                'tutoring_reviews_request_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('tutoring_reviews', function (Blueprint $table) {
            $table->dropUnique(
                'tutoring_reviews_request_unique'
            );
        });
    }
};