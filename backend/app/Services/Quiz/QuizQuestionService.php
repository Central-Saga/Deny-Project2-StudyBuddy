<?php

namespace App\Services\Quiz;

use App\Repositories\Contracts\QuizRepositoryInterface;
use Illuminate\Support\Str;

class QuizQuestionService
{
    public function __construct(private QuizRepositoryInterface $quizzes)
    {
    }

    public static function validationRules(bool $questionsRequired): array
    {
        return [
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'title' => $questionsRequired
                ? ['required', 'string', 'max:255']
                : ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'max_attempts' => ['nullable', 'integer', 'min:1', 'max:100'],
            'pass_score' => $questionsRequired
                ? ['required', 'integer', 'min:0', 'max:100']
                : ['sometimes', 'integer', 'min:0', 'max:100'],
            'is_published' => ['nullable', 'boolean'],
            'questions' => $questionsRequired
                ? ['required', 'array', 'min:1']
                : ['sometimes', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.question_type' => ['required', 'in:multiple_choice,true_false'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.option_text' => ['required', 'string', 'max:1000'],
            'questions.*.options.*.is_correct' => ['nullable', 'boolean'],
        ];
    }

    public static function attemptRules(): array
    {
        return [
            'answers' => ['nullable', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.option_id' => ['nullable', 'integer'],
            'answers.*.answer_text' => ['nullable', 'string'],
        ];
    }

    /**
     * Mengembalikan hasil error (422) bila struktur soal tidak valid, atau null.
     */
    public function validateStructure(array $questions): ?ServiceResult
    {
        foreach ($questions as $index => $question) {
            if ($question['question_type'] === 'essay') {
                continue;
            }

            $options = $question['options'] ?? [];
            $correctCount = collect($options)->where('is_correct', true)->count();

            if (count($options) < 2 || $correctCount !== 1) {
                return ServiceResult::error(
                    'Pertanyaan ke-' . ($index + 1) . ' harus memiliki minimal 2 opsi dan tepat 1 jawaban benar.',
                    422
                );
            }

            if ($question['question_type'] === 'true_false' && count($options) !== 2) {
                return ServiceResult::error(
                    'Pertanyaan true/false ke-' . ($index + 1) . ' harus memiliki tepat 2 opsi.',
                    422
                );
            }
        }

        return null;
    }

    public function uniqueSlug(string $title, ?int $ignoreQuizId = null): string
    {
        $baseSlug = Str::slug($title) ?: 'quiz';
        $slug = $baseSlug;
        $suffix = 2;

        while ($this->quizzes->slugExists($slug, $ignoreQuizId)) {
            $slug = $baseSlug . '-' . $suffix++;
        }

        return $slug;
    }
}
