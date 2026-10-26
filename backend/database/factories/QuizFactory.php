<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'creator_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'duration_minutes' => 30,
            'pass_score' => 70,
            'is_published' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['is_published' => true]);
    }

    public function disabledByAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
            'admin_disabled_at' => now(),
            'admin_disabled_by' => User::factory()->admin(),
            'admin_disabled_reason' => fake()->sentence(),
            'admin_disabled_was_published' => (bool) ($attributes['is_published'] ?? false),
        ]);
    }

    /**
     * Isi kuis dengan pertanyaan pilihan ganda, masing-masing satu opsi benar.
     */
    public function withQuestions(int $count = 3, int $optionsPerQuestion = 4): static
    {
        return $this->afterCreating(function (Quiz $quiz) use ($count, $optionsPerQuestion) {
            foreach (range(1, $count) as $order) {
                $question = \App\Models\QuizQuestion::factory()
                    ->for($quiz)
                    ->create(['order' => $order]);

                foreach (range(1, $optionsPerQuestion) as $i) {
                    \App\Models\QuizOption::factory()
                        ->for($question, 'question')
                        ->create(['is_correct' => $i === 1]);
                }
            }
        });
    }
}
