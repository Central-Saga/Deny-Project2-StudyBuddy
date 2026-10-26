<?php

namespace Database\Factories;

use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizOption>
 */
class QuizOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_question_id' => QuizQuestion::factory(),
            'option_text' => fake()->sentence(3),
            'is_correct' => false,
        ];
    }

    public function correct(): static
    {
        return $this->state(fn () => ['is_correct' => true]);
    }
}
