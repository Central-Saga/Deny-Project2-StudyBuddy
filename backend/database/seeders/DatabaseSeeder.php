<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SubjectSeeder::class,
            UserSeeder::class,
            AdminSeeder::class,
        ]);

        // Data demo hanya untuk lingkungan non-produksi.
        if (! app()->isProduction()) {
            $this->call(DemoDataSeeder::class);
        }
    }
}