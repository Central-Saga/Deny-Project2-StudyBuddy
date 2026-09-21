<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            [
                'code' => 'CS101',
                'name' => 'Pemrograman Web',
                'description' => 'Dasar-dasar pengembangan web modern menggunakan HTML, CSS, JavaScript, dan Framework.',
            ],
            [
                'code' => 'CS102',
                'name' => 'Struktur Data & Algoritma',
                'description' => 'Konsep penyimpanan data, pemrosesan algoritma, rekursi, dan efisiensi kode (Big O).',
            ],
            [
                'code' => 'CS103',
                'name' => 'Basis Data & SQL',
                'description' => 'Perancangan ERD, query SQL, normalisasi database, dan manajemen PostgreSQL/MySQL.',
            ],
            [
                'code' => 'CS104',
                'name' => 'Kecerdasan Buatan & ML',
                'description' => 'Pengenalan konsep Artificial Intelligence, Machine Learning, dan pemrosesan data.',
            ],
            [
                'code' => 'MATH101',
                'name' => 'Matematika Diskrit',
                'description' => 'Logika matematika, himpunan, teori graf, kombinatorika, dan aljabar Boolean.',
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                ['code' => $subject['code']], // Cari berdasarkan kode
                [
                    'name' => $subject['name'],
                    'slug' => Str::slug($subject['name']),
                    'description' => $subject['description'],
                ]
            );
        }
    }
}