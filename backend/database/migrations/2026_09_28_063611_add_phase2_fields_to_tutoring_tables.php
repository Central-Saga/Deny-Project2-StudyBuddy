<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->boolean('format_online')->default(true);
            $table->boolean('format_offline')->default(false);
        });

        Schema::table('tutoring_requests', function (Blueprint $table) {
            $table->enum('session_format', ['online', 'offline'])->nullable();
            $table->string('location', 500)->nullable();
            $table->text('session_notes')->nullable();

            $table->index(
                ['student_id', 'tutor_profile_id', 'status'],
                'tutoring_request_active_lookup'
            );
        });
    }

    public function down(): void
    {
        Schema::table('tutoring_requests', function (Blueprint $table) {
            $table->dropIndex('tutoring_request_active_lookup');

            $table->dropColumn([
                'session_format',
                'location',
                'session_notes',
            ]);
        });

        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'format_online',
                'format_offline',
            ]);
        });
    }
};