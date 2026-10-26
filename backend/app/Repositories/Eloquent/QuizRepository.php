<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\QuizRepositoryInterface;
use Closure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class QuizRepository implements QuizRepositoryInterface
{
    private const QUIZ_COLUMNS = [
        'q.id',
        'q.creator_id',
        'q.subject_id',
        'q.title',
        'q.slug',
        'q.description',
        'q.duration_minutes',
        'q.max_attempts',
        'q.pass_score',
        'q.is_published',
        'q.created_at',
        'q.updated_at',
        's.name as subject_name',
        'u.name as creator_name',
    ];

    private const ADMIN_COLUMNS = [
        'q.id',
        'q.creator_id',
        'q.subject_id',
        'q.title',
        'q.slug',
        'q.description',
        'q.duration_minutes',
        'q.max_attempts',
        'q.pass_score',
        'q.is_published',
        'q.admin_disabled_at',
        'q.admin_disabled_by',
        'q.admin_disabled_reason',
        'q.admin_disabled_was_published',
        'q.created_at',
        'q.updated_at',
        's.name as subject_name',
        's.code as subject_code',
        'creator.name as creator_name',
        'creator.email as creator_email',
        'moderator.name as moderator_name',
    ];

    public function transaction(Closure $callback)
    {
        return DB::transaction($callback);
    }

    private function quizMetaQuery()
    {
        return DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id');
    }

    public function listQuizzes(string $status, int $userId): Collection
    {
        return $this->quizMetaQuery()
            ->when(
                $status === 'inactive',
                fn ($query) => $query
                    ->where('q.is_published', false)
                    ->where('q.creator_id', $userId),
                fn ($query) => $query->where('q.is_published', true)
            )
            ->orderByDesc('q.updated_at')
            ->select(self::QUIZ_COLUMNS)
            ->get();
    }

    public function findVisibleQuizWithMeta(int $quizId, int $userId): ?object
    {
        return $this->quizMetaQuery()
            ->where('q.id', $quizId)
            ->where(function ($query) use ($userId) {
                $query->where('q.is_published', true)
                    ->orWhere('q.creator_id', $userId);
            })
            ->select(self::QUIZ_COLUMNS)
            ->first();
    }

    public function findQuizWithMeta(int $quizId): ?object
    {
        return $this->quizMetaQuery()
            ->where('q.id', $quizId)
            ->select(self::QUIZ_COLUMNS)
            ->first();
    }

    public function findQuiz(int $quizId): ?object
    {
        return DB::table('quizzes')->where('id', $quizId)->first();
    }

    public function findPublishedQuiz(int $quizId): ?object
    {
        return DB::table('quizzes')
            ->where('id', $quizId)
            ->where('is_published', true)
            ->first();
    }

    public function insertQuiz(array $data): int
    {
        return DB::table('quizzes')->insertGetId($data);
    }

    public function updateQuiz(int $quizId, array $data): void
    {
        DB::table('quizzes')->where('id', $quizId)->update($data);
    }

    public function slugExists(string $slug, ?int $ignoreQuizId = null): bool
    {
        return DB::table('quizzes')
            ->where('slug', $slug)
            ->when($ignoreQuizId, fn ($query) => $query->where('id', '!=', $ignoreQuizId))
            ->exists();
    }

    public function insertQuestions(int $quizId, array $questions, $now): void
    {
        foreach ($questions as $order => $question) {
            $questionId = DB::table('quiz_questions')->insertGetId([
                'quiz_id' => $quizId,
                'question_text' => $question['question_text'],
                'question_type' => $question['question_type'],
                'points' => $question['points'] ?? 1,
                'order' => $order,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($question['options'] ?? [] as $option) {
                DB::table('quiz_options')->insert([
                    'quiz_question_id' => $questionId,
                    'option_text' => $option['option_text'],
                    'is_correct' => $option['is_correct'] ?? false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function deleteQuestions(int $quizId): void
    {
        DB::table('quiz_questions')->where('quiz_id', $quizId)->delete();
    }

    public function questionsForQuizzes($quizIds): Collection
    {
        return DB::table('quiz_questions')
            ->whereIn('quiz_id', $quizIds)
            ->orderBy('order')
            ->get();
    }

    public function optionsForQuestions($questionIds): Collection
    {
        if (collect($questionIds)->isEmpty()) {
            return collect();
        }

        return DB::table('quiz_options')
            ->whereIn('quiz_question_id', $questionIds)
            ->select(['id', 'quiz_question_id', 'option_text', 'is_correct'])
            ->get();
    }

    public function questionsOrdered(int $quizId): Collection
    {
        return DB::table('quiz_questions')
            ->where('quiz_id', $quizId)
            ->orderBy('order')
            ->get();
    }

    public function optionsByIds($optionIds): Collection
    {
        if (collect($optionIds)->isEmpty()) {
            return collect();
        }

        return DB::table('quiz_options')
            ->whereIn('id', $optionIds)
            ->get()
            ->keyBy('id');
    }

    public function totalPoints(int $quizId): int
    {
        return (int) DB::table('quiz_questions')
            ->where('quiz_id', $quizId)
            ->sum('points');
    }

    public function hasAttempts(int $quizId): bool
    {
        return DB::table('quiz_attempts')->where('quiz_id', $quizId)->exists();
    }

    public function countFinishedAttempts(int $quizId, ?int $userId = null): int
    {
        return DB::table('quiz_attempts')
            ->where('quiz_id', $quizId)
            ->when($userId !== null, fn ($query) => $query->where('user_id', $userId))
            ->whereIn('status', ['completed', 'timed_out'])
            ->count();
    }

    public function attemptCountsByQuiz($quizIds): Collection
    {
        return DB::table('quiz_attempts')
            ->whereIn('quiz_id', $quizIds)
            ->select('quiz_id', DB::raw('COUNT(*) as total'))
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
    }

    public function finishedAttemptCountsByQuiz($quizIds, int $userId): Collection
    {
        return DB::table('quiz_attempts')
            ->whereIn('quiz_id', $quizIds)
            ->where('user_id', $userId)
            ->whereIn('status', ['completed', 'timed_out'])
            ->select('quiz_id', DB::raw('COUNT(*) as total'))
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
    }

    public function inProgressQuizIds($quizIds, int $userId): Collection
    {
        return DB::table('quiz_attempts')
            ->whereIn('quiz_id', $quizIds)
            ->where('user_id', $userId)
            ->where('status', 'in_progress')
            ->pluck('quiz_id');
    }

    public function findInProgressAttempt(int $quizId, int $userId): ?object
    {
        return DB::table('quiz_attempts')
            ->where('quiz_id', $quizId)
            ->where('user_id', $userId)
            ->where('status', 'in_progress')
            ->orderByDesc('id')
            ->first();
    }

    public function createAttempt(array $data): object
    {
        $attemptId = DB::table('quiz_attempts')->insertGetId($data);

        return DB::table('quiz_attempts')->where('id', $attemptId)->first();
    }

    public function findAttempt(int $attemptId, int $quizId, int $userId): ?object
    {
        return DB::table('quiz_attempts')
            ->where('id', $attemptId)
            ->where('quiz_id', $quizId)
            ->where('user_id', $userId)
            ->first();
    }

    public function replaceAnswers(int $attemptId, array $rows): void
    {
        DB::table('quiz_answers')->where('quiz_attempt_id', $attemptId)->delete();

        foreach ($rows as $row) {
            DB::table('quiz_answers')->insert($row);
        }
    }

    public function updateAttempt(int $attemptId, array $data): void
    {
        DB::table('quiz_attempts')->where('id', $attemptId)->update($data);
    }

    public function answersForAttempt(int $attemptId): Collection
    {
        return DB::table('quiz_answers')
            ->where('quiz_attempt_id', $attemptId)
            ->get()
            ->keyBy('quiz_question_id');
    }

    private function adminQuery()
    {
        return DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'q.creator_id')
            ->leftJoin('users as moderator', 'moderator.id', '=', 'q.admin_disabled_by');
    }

    public function adminList(?string $search, ?string $status): Collection
    {
        $query = $this->adminQuery();

        if (!empty($search)) {
            $like = '%' . strtolower(trim($search)) . '%';

            $query->where(function ($query) use ($like) {
                $query
                    ->whereRaw('LOWER(q.title) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(q.description, \'\')) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(creator.name, \'\')) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(creator.email, \'\')) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(s.name, \'\')) LIKE ?', [$like]);
            });
        }

        if ($status === 'published') {
            $query->where('q.is_published', true)->whereNull('q.admin_disabled_at');
        }

        if ($status === 'unpublished') {
            $query->where('q.is_published', false)->whereNull('q.admin_disabled_at');
        }

        if ($status === 'admin_disabled') {
            $query->whereNotNull('q.admin_disabled_at');
        }

        return $query
            ->orderByDesc('q.updated_at')
            ->select(self::ADMIN_COLUMNS)
            ->get();
    }

    public function adminFindQuiz(int $quizId): ?object
    {
        return $this->adminQuery()
            ->where('q.id', $quizId)
            ->select([...self::ADMIN_COLUMNS, 'moderator.email as moderator_email'])
            ->first();
    }

    public function adminQuestions(int $quizId): Collection
    {
        return DB::table('quiz_questions')
            ->where('quiz_id', $quizId)
            ->orderBy('order')
            ->orderBy('id')
            ->select(['id', 'quiz_id', 'question_text', 'question_type', 'points', 'order'])
            ->get();
    }

    public function adminOptionsGrouped($questionIds): Collection
    {
        if (collect($questionIds)->isEmpty()) {
            return collect();
        }

        return DB::table('quiz_options')
            ->whereIn('quiz_question_id', $questionIds)
            ->orderBy('id')
            ->select(['id', 'quiz_question_id', 'option_text', 'is_correct'])
            ->get()
            ->groupBy('quiz_question_id');
    }

    public function adminQuestionCounts($quizIds): Collection
    {
        return DB::table('quiz_questions')
            ->whereIn('quiz_id', $quizIds)
            ->selectRaw('quiz_id, COUNT(*) as total')
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
    }

    public function adminAttemptCounts($quizIds, bool $completedOnly = false): Collection
    {
        return DB::table('quiz_attempts')
            ->whereIn('quiz_id', $quizIds)
            ->when($completedOnly, fn ($query) => $query->where('status', 'completed'))
            ->selectRaw('quiz_id, COUNT(*) as total')
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
    }

    public function adminAttemptSummary(int $quizId): ?object
    {
        return DB::table('quiz_attempts')
            ->where('quiz_id', $quizId)
            ->selectRaw(
                "
                COUNT(*) as total_attempts,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_attempts,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_attempts,
                SUM(CASE WHEN status = 'timed_out' THEN 1 ELSE 0 END) as timed_out_attempts,
                AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) as average_score
                "
            )
            ->first();
    }
}
