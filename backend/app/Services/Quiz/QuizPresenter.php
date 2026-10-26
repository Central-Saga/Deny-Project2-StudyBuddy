<?php

namespace App\Services\Quiz;

use App\Repositories\Contracts\QuizRepositoryInterface;
use Illuminate\Support\Collection;

class QuizPresenter
{
    public function __construct(private QuizRepositoryInterface $quizzes)
    {
    }

    public function attachQuizQuestions($quizzes, ?int $viewerId = null, bool $includeCorrectForOwner = false): Collection
    {
        $quizIds = collect($quizzes)->pluck('id')->values();

        if ($quizIds->isEmpty()) {
            return collect();
        }

        $questions = $this->quizzes->questionsForQuizzes($quizIds);
        $questionIds = $questions->pluck('id')->values();
        $options = $questionIds->isEmpty()
            ? collect()
            : $this->quizzes->optionsForQuestions($questionIds);

        $attemptCounts = $this->quizzes->attemptCountsByQuiz($quizIds);

        $viewerAttemptCounts = collect();
        $viewerInProgressQuizIds = collect();

        if ($viewerId !== null) {
            $viewerAttemptCounts = $this->quizzes->finishedAttemptCountsByQuiz($quizIds, $viewerId);
            $viewerInProgressQuizIds = $this->quizzes->inProgressQuizIds($quizIds, $viewerId);
        }

        $optionsByQuestion = $options->groupBy('quiz_question_id');
        $questionsByQuiz = $questions->groupBy('quiz_id');

        return collect($quizzes)->map(function ($quiz) use (
            $questionsByQuiz,
            $optionsByQuestion,
            $attemptCounts,
            $viewerAttemptCounts,
            $viewerInProgressQuizIds,
            $viewerId,
            $includeCorrectForOwner
        ) {
            $canManage = $viewerId !== null && (int) $quiz->creator_id === (int) $viewerId;

            $questions = $questionsByQuiz->get($quiz->id, collect())->map(
                fn ($question) => $this->formatQuestion(
                    $question,
                    $optionsByQuestion,
                    $canManage && $includeCorrectForOwner
                )
            )->values();

            $attemptsUsed = (int) ($viewerAttemptCounts[$quiz->id] ?? 0);
            $maxAttempts = $quiz->max_attempts !== null ? (int) $quiz->max_attempts : null;
            $hasInProgress = $viewerInProgressQuizIds->contains($quiz->id);
            $attemptsRemaining = $maxAttempts !== null
                ? max(0, $maxAttempts - $attemptsUsed)
                : null;
            $canAttempt = $hasInProgress || $maxAttempts === null || $attemptsUsed < $maxAttempts;

            return [
                'id' => $quiz->id,
                'creator_id' => $quiz->creator_id,
                'subject_id' => $quiz->subject_id,
                'title' => $quiz->title,
                'slug' => $quiz->slug,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'max_attempts' => $maxAttempts,
                'pass_score' => (int) $quiz->pass_score,
                'is_published' => (bool) $quiz->is_published,
                'created_at' => $quiz->created_at,
                'updated_at' => $quiz->updated_at ?? null,
                'subject_name' => $quiz->subject_name,
                'creator_name' => $quiz->creator_name,
                'question_count' => $questions->count(),
                'attempt_count' => (int) ($attemptCounts[$quiz->id] ?? 0),
                'attempts_used' => $attemptsUsed,
                'attempts_remaining' => $attemptsRemaining,
                'has_in_progress_attempt' => $hasInProgress,
                'can_attempt' => $canAttempt,
                'can_manage' => $canManage,
                'questions' => $questions,
            ];
        })->values();
    }

    public function getQuizPayload(int $quizId, ?int $viewerId = null, bool $includeCorrectForOwner = false): array
    {
        $row = $this->quizzes->findQuizWithMeta($quizId);

        if (!$row) {
            return [];
        }

        return $this->attachQuizQuestions(collect([$row]), $viewerId, $includeCorrectForOwner)->first() ?? [];
    }

    private function formatQuestion($question, Collection $optionsByQuestion, bool $showCorrect): array
    {
        return [
            'id' => $question->id,
            'question_text' => $question->question_text,
            'question_type' => $question->question_type,
            'points' => (int) $question->points,
            'order' => (int) $question->order,
            'options' => $optionsByQuestion->get($question->id, collect())
                ->values()
                ->map(function ($option) use ($showCorrect) {
                    $payload = [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                    ];

                    if ($showCorrect) {
                        $payload['is_correct'] = (bool) $option->is_correct;
                    }

                    return $payload;
                })
                ->values(),
        ];
    }
}
