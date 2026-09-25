<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('learning_styles')
                ->nullable()
                ->after('skills');

            $table->timestamp('last_active_at')
                ->nullable()
                ->after('bio');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'learning_styles',
                'last_active_at',
            ]);
        });
    }
};