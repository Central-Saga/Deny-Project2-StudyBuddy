<?php

namespace Database\Factories;

use App\Models\StudyGroup;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StudyGroup>
 */
class StudyGroupFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'creator_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'max_members' => 10,
            'is_private' => false,
        ];
    }

    public function private(): static
    {
        return $this->state(fn () => ['is_private' => true]);
    }

    /**
     * Daftarkan pembuat grup sebagai admin yang sudah diterima.
     */
    public function withCreatorAsAdmin(): static
    {
        return $this->afterCreating(function (StudyGroup $group) {
            $group->members()->create([
                'user_id' => $group->creator_id,
                'role' => 'admin',
                'status' => 'accepted',
                'joined_at' => now(),
            ]);
        });
    }
}
