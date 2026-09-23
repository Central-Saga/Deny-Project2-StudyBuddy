<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('group_user');
        Schema::dropIfExists('groups');
    }

    public function down(): void
    {
        // Tabel legacy groups/group_user sengaja tidak dibuat kembali.
    }
};