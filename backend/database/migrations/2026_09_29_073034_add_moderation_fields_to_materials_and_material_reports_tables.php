<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('material_reports', function (Blueprint $table) {
            $table->text('resolution_note')->nullable();

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('material_reports', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);

            $table->dropColumn([
                'resolution_note',
                'reviewed_by',
                'reviewed_at',
            ]);
        });

        Schema::table('materials', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};