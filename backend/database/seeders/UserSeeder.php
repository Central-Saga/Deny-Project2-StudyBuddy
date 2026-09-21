<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\Subject;
use App\Models\UserSubject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Budi (Tutor / Mahasiswa Senior)
        $budi = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        Profile::create([
            'user_id' => $budi->id,
            'bio' => 'Mahasiswa Informatika semester 6 yang suka berbagi ilmu seputar Pemrograman Web dan Laravel.',
            'university' => 'Universitas Indonesia',
            'major' => 'Teknik Informatika',
            'phone_number' => '081234567890',
            'github_url' => 'https://github.com/budisantoso',
        ]);

        // 2. Akun Siti (Student)
        $siti = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => Hash::make('password123'),
        ]);

        Profile::create([
            'user_id' => $siti->id,
            'bio' => 'Sedang giat belajar Struktur Data dan Matematika Diskrit.',
            'university' => 'Institut Teknologi Bandung',
            'major' => 'Sistem Informasi',
            'phone_number' => '089876543210',
        ]);

        // Hubungkan User dengan Subject
        $webDev = Subject::where('code', 'CS101')->first();
        $sda = Subject::where('code', 'CS102')->first();

        if ($webDev) {
            UserSubject::create([
                'user_id' => $budi->id,
                'subject_id' => $webDev->id,
                'proficiency_level' => 'advanced',
                'type' => 'teaching',
            ]);
        }

        if ($sda) {
            UserSubject::create([
                'user_id' => $siti->id,
                'subject_id' => $sda->id,
                'proficiency_level' => 'beginner',
                'type' => 'learning',
            ]);
        }
    }
}