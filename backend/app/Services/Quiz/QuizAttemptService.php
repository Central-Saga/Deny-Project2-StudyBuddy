<?php

namespace App\Services\Quiz;

use App\Repositories\Contracts\QuizRepositoryInterface;

class QuizAttemptService
{
    public function __construct(private QuizRepositoryInterface $quizzes)
    {
    }

    public function start(int $quizId, int $userId): ServiceResult
    {
        $quizRow = $this->quizzes->findPublishedQuiz($quizId);

        if (!$quizRow) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        $existing = $this->quizzes->findInProgressAttempt($quizId, $userId);
        $usedAttempts = $this->quizzes->countFinishedAttempts($quizId, $userId);

        if ($existing) {
            return new ServiceResult($this->attemptPayload($existing, $quizId, $quizRow, $usedAttempts));
        }

        if ($quizRow->max_attempts !== null && $usedAttempts >= (int) $quizRow->max_attempts) {
            return new ServiceResult([
                'message' => 'Batas percobaan kuis telah tercapai.',
                'max_attempts' => (int) $quizRow->max_attempts,
                'attempts_used' => $usedAttempts,
                'attempts_remaining' => 0,
                'can_attempt' => false,
            ], 422);
        }

        $attempt = $this->quizzes->createAttempt([
            'quiz_id' => $quizId,
            'user_id' => $userId,
            'score' => null,
            'total_points' => $this->quizzes->totalPoints($quizId),
            'started_at' => now(),
            'completed_at' => null,
            'status' => 'in_progress',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return new ServiceResult($this->attemptPayload($attempt, $quizId, $quizRow, $usedAttempts), 201);
    }

    public function submit(int $quizId, int $attemptId, int $userId, array $validated): ServiceResult
    {
        $attemptRow = $this->quizzes->findAttempt($attemptId, $quizId, $userId);

        if (!$attemptRow) {
            return ServiceResult::error('Percobaan kuis tidak ditemukan.', 404);
        }

        if ($attemptRow->status !== 'in_progress') {
            return ServiceResult::error('Kuis ini sudah dikumpulkan.', 422);
        }

        $quizRow = $this->quizzes->findQuiz($quizId);

        if (!$quizRow) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        $questions = $this->quizzes->questionsOrdered($quizId);
        $answers = collect($validated['answers'] ?? []);
        $answerMap = $answers->keyBy('question_id');
        $options = $this->quizzes->optionsByIds(
            $answers->pluck('option_id')->filter()->map(fn ($id) => (int) $id)->values()
        );

        $now = now();
        $earnedPoints = 0;
        $rows = [];

        foreach ($questions as $question) {
            $answer = $answerMap->get((string) $question->id) ?? $answerMap->get($question->id);
            $option = null;
            $isCorrect = null;
            $pointsAwarded = 0;
            $optionId = $answer['option_id'] ?? null;

            if ($question->question_type !== 'essay' && $optionId) {
                $candidate = $options->get((int) $optionId);

                if ($candidate && (int) $candidate->quiz_question_id === (int) $question->id) {
                    $option = $candidate;
                    $isCorrect = (bool) $option->is_correct;
                    $pointsAwarded = $isCorrect ? (int) $question->points : 0;
                    $earnedPoints += $pointsAwarded;
                }
            }

            $rows[] = [
                'quiz_attempt_id' => $attemptId,
                'quiz_question_id' => $question->id,
                'quiz_option_id' => $option ? $option->id : null,
                'answer_text' => $answer['answer_text'] ?? null,
                'is_correct' => $isCorrect,
                'points_awarded' => $pointsAwarded,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->quizzes->transaction(fn () => $this->quizzes->replaceAnswers($attemptId, $rows));

        $totalPoints = (int) $questions->sum('points');
        $score = $totalPoints > 0
            ? (int) round(($earnedPoints / $totalPoints) * 100)
            : 0;

        $this->quizzes->updateAttempt($attemptId, [
            'score' => $score,
            'total_points' => $totalPoints,
            'completed_at' => now(),
            'status' => 'completed',
            'updated_at' => now(),
        ]);

        $usedAttempts = $this->quizzes->countFinishedAttempts($quizId, $userId);
        $maxAttempts = $quizRow->max_attempts !== null ? (int) $quizRow->max_attempts : null;

        return new ServiceResult([
            'message' => 'Kuis berhasil dikumpulkan.',
            'attempt_id' => $attemptId,
            'earned_points' => $earnedPoints,
            'total_points' => $totalPoints,
            'score' => $score,
            'pass_score' => (int) $quizRow->pass_score,
            'passed' => $score >= (int) $quizRow->pass_score,
            'max_attempts' => $maxAttempts,
            'attempts_used' => $usedAttempts,
            'attempts_remaining' => $maxAttempts !== null ? max(0, $maxAttempts - $usedAttempts) : null,
            'can_attempt' => $maxAttempts === null || $usedAttempts < $maxAttempts,
            'review' => $this->buildReview($questions, $attemptId),
        ]);
    }

    private function attemptPayload($attempt, int $quizId, $quizRow, int $usedAttempts): array
    {
        return [
            'attempt_id' => $attempt->id,
            'quiz_id' => $quizId,
            'started_at' => $attempt->started_at,
            'status' => $attempt->status,
            'max_attempts' => $quizRow->max_attempts !== null ? (int) $quizRow->max_attempts : null,
            'attempts_used' => $usedAttempts,
            'attempts_remaining' => $quizRow->max_attempts !== null
                ? max(0, (int) $quizRow->max_attempts - $usedAttempts)
                : null,
            'can_attempt' => true,
        ];
    }

    private function buildReview($questions, int $attemptId)
    {
        $questionIds = $questions->pluck('id')->values();
        $allOptions = $this->quizzes->optionsForQuestions($questionIds);
        $optionsById = $allOptions->keyBy('id');
        $correctOptionsByQuestion = $allOptions->where('is_correct', true)->keyBy('quiz_question_id');
        $storedAnswers = $this->quizzes->answersForAttempt($attemptId);

        return $questions->map(function ($question) use ($storedAnswers, $optionsById, $correctOptionsByQuestion) {
            $storedAnswer = $storedAnswers->get($question->id);
            $selectedOption = $storedAnswer?->quiz_option_id
                ? $optionsById->get((int) $storedAnswer->quiz_option_id)
                : null;
            $correctOption = $question->question_type === 'essay'
                ? null
                : $correctOptionsByQuestion->get($question->id);

            return [
                'question_id' => (int) $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'points' => (int) $question->points,
                'user_answer' => [
                    'option_id' => $selectedOption?->id,
                    'option_text' => $selectedOption?->option_text,
                    'answer_text' => $storedAnswer?->answer_text,
                ],
                'correct_answer' => $correctOption ? [
                    'option_id' => (int) $correctOption->id,
                    'option_text' => $correctOption->option_text,
                ] : null,
                'is_correct' => $question->question_type === 'essay'
                    ? null
                    : (bool) ($storedAnswer?->is_correct ?? false),
                'points_awarded' => (int) ($storedAnswer?->points_awarded ?? 0),
            ];
        })->values();
    }
}
