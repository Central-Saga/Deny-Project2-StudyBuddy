<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'user_id' => User::factory(),
            'score' => null,
            'total_points' => null,
            'started_at' => now(),
            'completed_at' => null,
            'status' => 'in_progress',
        ];
    }

    public function completed(int $score = 80, int $totalPoints = 100): static
    {
        return $this->state(fn () => [
            'score' => $score,
            'total_points' => $totalPoints,
            'started_at' => now()->subMinutes(20),
            'completed_at' => now(),
            'status' => 'completed',
        ]);
    }

    public function timedOut(): static
    {
        return $this->state(fn () => [
            'started_at' => now()->subHour(),
            'completed_at' => now(),
            'status' => 'timed_out',
        ]);
    }
}
