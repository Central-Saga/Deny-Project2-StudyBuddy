<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\Subject;
use App\Models\User;
use App\Models\UserSubject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Budi (Tutor / Mahasiswa Senior)
        $budi = User::firstOrCreate(
            ['email' => 'budi@example.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password123'),
            ]
        );

        Profile::firstOrCreate(['user_id' => $budi->id], [
            'bio' => 'Mahasiswa Informatika semester 6 yang suka berbagi ilmu seputar Pemrograman Web dan Laravel.',
            'university' => 'Universitas Indonesia',
            'major' => 'Teknik Informatika',
            'phone_number' => '081234567890',
            'github_url' => 'https://github.com/budisantoso',
        ]);

        // 2. Akun Siti (Student)
        $siti = User::firstOrCreate(
            ['email' => 'siti@example.com'],
            [
                'name' => 'Siti Aminah',
                'password' => Hash::make('password123'),
            ]
        );

        Profile::firstOrCreate(['user_id' => $siti->id], [
            'bio' => 'Sedang giat belajar Struktur Data dan Matematika Diskrit.',
            'university' => 'Institut Teknologi Bandung',
            'major' => 'Sistem Informasi',
            'phone_number' => '089876543210',
        ]);

        // Hubungkan User dengan Subject
        $webDev = Subject::where('code', 'CS101')->first();
        $sda = Subject::where('code', 'CS102')->first();

        if ($webDev) {
            UserSubject::firstOrCreate(
                [
                    'user_id' => $budi->id,
                    'subject_id' => $webDev->id,
                    'type' => 'teaching',
                ],
                ['proficiency_level' => 'advanced']
            );
        }

        if ($sda) {
            UserSubject::firstOrCreate(
                [
                    'user_id' => $siti->id,
                    'subject_id' => $sda->id,
                    'type' => 'learning',
                ],
                ['proficiency_level' => 'beginner']
            );
        }
    }
}
