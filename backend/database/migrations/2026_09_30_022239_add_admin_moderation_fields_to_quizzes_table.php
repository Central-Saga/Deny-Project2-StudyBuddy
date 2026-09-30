<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->timestamp('admin_disabled_at')
                ->nullable();

            $table->foreignId('admin_disabled_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('admin_disabled_reason')
                ->nullable();

            $table->boolean('admin_disabled_was_published')
                ->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropForeign([
                'admin_disabled_by',
            ]);

            $table->dropColumn([
                'admin_disabled_at',
                'admin_disabled_by',
                'admin_disabled_reason',
                'admin_disabled_was_published',
            ]);
        });
    }
};