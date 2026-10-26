<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'study_groups',
        'study_sessions',
        'quizzes',
        'tutoring_requests',
        'buddy_connections',
    ];

    public function up(): void
    {
        foreach ($this->tables as $name) {
            if (! Schema::hasColumn($name, 'deleted_at')) {
                Schema::table($name, fn (Blueprint $table) => $table->softDeletes());
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $name) {
            if (Schema::hasColumn($name, 'deleted_at')) {
                Schema::table($name, fn (Blueprint $table) => $table->dropSoftDeletes());
            }
        }
    }
};
