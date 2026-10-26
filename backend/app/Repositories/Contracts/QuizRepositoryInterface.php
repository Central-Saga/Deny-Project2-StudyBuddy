<?php

namespace App\Repositories\Contracts;

use Closure;
use Illuminate\Support\Collection;

interface QuizRepositoryInterface
{
    public function transaction(Closure $callback);

    // Quiz (user-facing)
    public function listQuizzes(string $status, int $userId): Collection;

    public function findVisibleQuizWithMeta(int $quizId, int $userId): ?object;

    public function findQuizWithMeta(int $quizId): ?object;

    public function findQuiz(int $quizId): ?object;

    public function findPublishedQuiz(int $quizId): ?object;

    public function insertQuiz(array $data): int;

    public function updateQuiz(int $quizId, array $data): void;

    public function slugExists(string $slug, ?int $ignoreQuizId = null): bool;

    // Questions & options
    public function insertQuestions(int $quizId, array $questions, $now): void;

    public function deleteQuestions(int $quizId): void;

    public function questionsForQuizzes($quizIds): Collection;

    public function optionsForQuestions($questionIds): Collection;

    public function questionsOrdered(int $quizId): Collection;

    public function optionsByIds($optionIds): Collection;

    public function totalPoints(int $quizId): int;

    // Attempts
    public function hasAttempts(int $quizId): bool;

    public function countFinishedAttempts(int $quizId, ?int $userId = null): int;

    public function attemptCountsByQuiz($quizIds): Collection;

    public function finishedAttemptCountsByQuiz($quizIds, int $userId): Collection;

    public function inProgressQuizIds($quizIds, int $userId): Collection;

    public function findInProgressAttempt(int $quizId, int $userId): ?object;

    public function createAttempt(array $data): object;

    public function findAttempt(int $attemptId, int $quizId, int $userId): ?object;

    public function replaceAnswers(int $attemptId, array $rows): void;

    public function updateAttempt(int $attemptId, array $data): void;

    public function answersForAttempt(int $attemptId): Collection;

    // Admin
    public function adminList(?string $search, ?string $status): Collection;

    public function adminFindQuiz(int $quizId): ?object;

    public function adminQuestions(int $quizId): Collection;

    public function adminOptionsGrouped($questionIds): Collection;

    public function adminQuestionCounts($quizIds): Collection;

    public function adminAttemptCounts($quizIds, bool $completedOnly = false): Collection;

    public function adminAttemptSummary(int $quizId): ?object;
}
