<?php

namespace Database\Factories;

use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAnswer>
 */
class QuizAnswerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_attempt_id' => QuizAttempt::factory(),
            'quiz_question_id' => QuizQuestion::factory(),
            'quiz_option_id' => QuizOption::factory(),
            'answer_text' => null,
            'is_correct' => false,
            'points_awarded' => 0,
        ];
    }

    public function correct(int $points = 1): static
    {
        return $this->state(fn () => [
            'is_correct' => true,
            'points_awarded' => $points,
        ]);
    }
}
