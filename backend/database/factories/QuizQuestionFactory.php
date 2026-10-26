<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question_text' => rtrim(fake()->sentence(8), '.') . '?',
            'question_type' => 'multiple_choice',
            'points' => 1,
            'order' => 0,
        ];
    }

    public function trueFalse(): static
    {
        return $this->state(fn () => ['question_type' => 'true_false']);
    }

    public function essay(): static
    {
        return $this->state(fn () => ['question_type' => 'essay']);
    }
}
