<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed akun administrator sistem.
     */
    public function run(): void
    {
        $admin = User::query()
            ->firstOrNew([
                'email' => env(
                    'ADMIN_EMAIL',
                    'admin@studybuddy.test'
                ),
            ]);

        $admin->name = env(
            'ADMIN_NAME',
            'Study Buddy Admin'
        );

        $admin->password = Hash::make(
            env(
                'ADMIN_PASSWORD',
                'Admin12345!'
            )
        );

        /*
         * Role dan account_status tidak
         * dimasukkan ke $fillable,
         * sehingga di-set secara eksplisit.
         */
        $admin->role =
            User::ROLE_ADMIN;

        $admin->account_status =
            User::STATUS_ACTIVE;

        $admin->save();

        /*
         * Pastikan admin memiliki profile
         * agar kompatibel dengan flow user.
         */
        $admin->profile()
            ->firstOrCreate([]);
    }
}