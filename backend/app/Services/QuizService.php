<?php

namespace App\Services;

use App\Repositories\Contracts\QuizRepositoryInterface;
use App\Services\Quiz\QuizAttemptService;
use App\Services\Quiz\QuizPresenter;
use App\Services\Quiz\QuizQuestionService;
use App\Services\Quiz\ServiceResult;

class QuizService
{
    private const UPDATABLE_FIELDS = [
        'subject_id',
        'title',
        'description',
        'duration_minutes',
        'max_attempts',
        'pass_score',
        'is_published',
    ];

    public function __construct(
        private QuizRepositoryInterface $quizzes,
        private QuizPresenter $presenter,
        private QuizQuestionService $questionService,
        private QuizAttemptService $attemptService
    ) {
    }

    public function list(string $status, int $userId)
    {
        return $this->presenter->attachQuizQuestions(
            $this->quizzes->listQuizzes($status, $userId),
            $userId,
            false
        );
    }

    public function show(int $quizId, int $userId): ServiceResult
    {
        $row = $this->quizzes->findVisibleQuizWithMeta($quizId, $userId);

        if (!$row) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        return new ServiceResult(
            $this->presenter->attachQuizQuestions(collect([$row]), $userId, true)->first()
        );
    }

    public function create(array $validated, int $userId): ServiceResult
    {
        if ($error = $this->questionService->validateStructure($validated['questions'])) {
            return $error;
        }

        $quizId = $this->quizzes->transaction(function () use ($validated, $userId) {
            $now = now();
            $slug = $this->questionService->uniqueSlug($validated['title']);

            $id = $this->quizzes->insertQuiz([
                'creator_id' => $userId,
                'subject_id' => $validated['subject_id'] ?? null,
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'duration_minutes' => $validated['duration_minutes'] ?? null,
                'max_attempts' => $validated['max_attempts'] ?? null,
                'pass_score' => $validated['pass_score'] ?? 70,
                'is_published' => $validated['is_published'] ?? true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->quizzes->insertQuestions($id, $validated['questions'], $now);

            return $id;
        });

        return new ServiceResult([
            'message' => 'Kuis berhasil dibuat.',
            'data' => $this->presenter->getQuizPayload($quizId, $userId, true),
        ], 201);
    }

    /**
     * Cek keberadaan dan kepemilikan kuis sebelum request divalidasi.
     * Mengembalikan baris kuis atau ServiceResult error.
     */
    public function findOwnedForUpdate(int $quizId, int $userId, string $forbiddenMessage)
    {
        $quizRow = $this->quizzes->findQuiz($quizId);

        if (!$quizRow) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        if ((int) $quizRow->creator_id !== $userId) {
            return ServiceResult::error($forbiddenMessage, 403);
        }

        return $quizRow;
    }

    public function update(int $quizId, int $userId, array $validated, object $quizRow): ServiceResult
    {
        // Creator tidak boleh mem-publish kembali kuis
        // yang sedang dinonaktifkan oleh administrator.
        if (
            array_key_exists('is_published', $validated) &&
            (bool) $validated['is_published'] === true &&
            $quizRow->admin_disabled_at !== null
        ) {
            return ServiceResult::error(
                'Kuis sedang dinonaktifkan oleh administrator dan tidak dapat dipublikasikan kembali.',
                422
            );
        }

        if (array_key_exists('questions', $validated)) {
            if ($error = $this->questionService->validateStructure($validated['questions'])) {
                return $error;
            }

            if ($this->quizzes->hasAttempts($quizId)) {
                return ServiceResult::error(
                    'Soal tidak dapat diubah karena kuis ini sudah memiliki riwayat percobaan. Kamu masih dapat mengubah judul, deskripsi, mata kuliah, durasi, nilai lulus, dan batas percobaan.',
                    422
                );
            }
        }

        if (array_key_exists('max_attempts', $validated) && $validated['max_attempts'] !== null) {
            $usedAttempts = $this->quizzes->countFinishedAttempts($quizId);

            if ((int) $validated['max_attempts'] < $usedAttempts) {
                return ServiceResult::error(
                    'Batas percobaan tidak boleh lebih kecil dari jumlah percobaan yang sudah selesai.',
                    422
                );
            }
        }

        $this->quizzes->transaction(function () use ($quizId, $quizRow, $validated) {
            $now = now();
            $updates = [];

            foreach (self::UPDATABLE_FIELDS as $field) {
                if (array_key_exists($field, $validated)) {
                    $updates[$field] = $validated[$field];
                }
            }

            if (array_key_exists('title', $validated) && $validated['title'] !== $quizRow->title) {
                $updates['slug'] = $this->questionService->uniqueSlug($validated['title'], $quizId);
            }

            if (!empty($updates)) {
                $this->quizzes->updateQuiz($quizId, $updates);
            }

            if (array_key_exists('questions', $validated)) {
                $this->quizzes->deleteQuestions($quizId);
                $this->quizzes->insertQuestions($quizId, $validated['questions'], $now);
            }
        });

        return new ServiceResult([
            'message' => 'Kuis berhasil diperbarui.',
            'data' => $this->presenter->getQuizPayload($quizId, $userId, true),
        ]);
    }

    /**
     * Logical delete: kuis tidak dihapus permanen agar attempt/jawaban tetap tersimpan.
     */
    public function deactivate(int $quizId, int $userId): ServiceResult
    {
        $quizRow = $this->findOwnedForUpdate(
            $quizId,
            $userId,
            'Kamu hanya dapat menonaktifkan kuis milikmu sendiri.'
        );

        if ($quizRow instanceof ServiceResult) {
            return $quizRow;
        }

        if (!$quizRow->is_published) {
            return new ServiceResult(['message' => 'Kuis sudah dalam keadaan nonaktif.']);
        }

        $this->quizzes->updateQuiz($quizId, [
            'is_published' => false,
            'updated_at' => now(),
        ]);

        return new ServiceResult([
            'message' => 'Kuis berhasil dinonaktifkan. Riwayat pengerjaan tetap disimpan.',
        ]);
    }

    public function start(int $quizId, int $userId): ServiceResult
    {
        return $this->attemptService->start($quizId, $userId);
    }

    public function submit(int $quizId, int $attemptId, int $userId, array $validated): ServiceResult
    {
        return $this->attemptService->submit($quizId, $attemptId, $userId, $validated);
    }
}
