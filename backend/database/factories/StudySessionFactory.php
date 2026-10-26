<?php

namespace Database\Factories;

use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudySession>
 */
class StudySessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'host_id' => User::factory(),
            'study_group_id' => StudyGroup::factory(),
            'subject_id' => Subject::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'meeting_link' => 'https://meet.example.com/' . fake()->lexify('????-????'),
            'max_participants' => 5,
            'scheduled_at' => now()->addDays(3),
            'duration_minutes' => 60,
            'status' => 'scheduled',
        ];
    }

    public function ongoing(): static
    {
        return $this->state(fn () => ['status' => 'ongoing']);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
            'scheduled_at' => now()->subDays(3),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => 'cancelled']);
    }
}
