<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'subject' => fake()->randomElement([
                'Basis Data',
                'Pemrograman Web',
                'Struktur Data',
            ]),
            'file_path' => 'materials/' . fake()->unique()->lexify('????????????') . '.pdf',
            'file_type' => 'pdf',
            'file_size' => fake()->numberBetween(10_000, 5_000_000),
        ];
    }
}
