<?php

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'code' => strtoupper(Str::random(3)) . fake()->unique()->numberBetween(1000, 99999),
            'name' => ucfirst($name),
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(5)),
            'description' => fake()->sentence(),
        ];
    }
}
