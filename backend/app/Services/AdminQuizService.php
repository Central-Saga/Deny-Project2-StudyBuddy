<?php

namespace App\Services;

use App\Repositories\Contracts\QuizRepositoryInterface;
use App\Services\Quiz\AdminQuizPresenter;
use App\Services\Quiz\ServiceResult;

class AdminQuizService
{
    public function __construct(
        private QuizRepositoryInterface $quizzes,
        private AdminQuizPresenter $presenter
    ) {
    }

    public function list(?string $search, ?string $status): ServiceResult
    {
        $quizzes = $this->quizzes->adminList($search, $status);

        if ($quizzes->isEmpty()) {
            return new ServiceResult([
                'message' => 'Daftar kuis berhasil diambil.',
                'data' => [],
            ]);
        }

        $quizIds = $quizzes->pluck('id');
        $questionCounts = $this->quizzes->adminQuestionCounts($quizIds);
        $attemptCounts = $this->quizzes->adminAttemptCounts($quizIds);
        $completedCounts = $this->quizzes->adminAttemptCounts($quizIds, true);

        return new ServiceResult([
            'message' => 'Daftar kuis berhasil diambil.',
            'data' => $quizzes->map(
                fn ($quiz) => $this->presenter->listItem($quiz, $questionCounts, $attemptCounts, $completedCounts)
            )->values(),
        ]);
    }

    public function show(int $quizId): ServiceResult
    {
        $row = $this->quizzes->adminFindQuiz($quizId);

        if (!$row) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        $questions = $this->quizzes->adminQuestions($quizId);
        $options = $this->quizzes->adminOptionsGrouped($questions->pluck('id'));

        return new ServiceResult([
            'message' => 'Detail kuis berhasil diambil.',
            'data' => $this->presenter->detail(
                $row,
                $this->presenter->questions($questions, $options),
                $this->quizzes->adminAttemptSummary($quizId)
            ),
        ]);
    }

    /**
     * Status publish sebelumnya disimpan agar restore dapat mengembalikan kondisi awal.
     */
    public function disable(int $quizId, int $adminId, string $reason): ServiceResult
    {
        $row = $this->quizzes->findQuiz($quizId);

        if (!$row) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        if ($row->admin_disabled_at !== null) {
            return ServiceResult::error('Kuis sudah dinonaktifkan oleh administrator.', 422);
        }

        $this->quizzes->updateQuiz($quizId, [
            'is_published' => false,
            'admin_disabled_at' => now(),
            'admin_disabled_by' => $adminId,
            'admin_disabled_reason' => trim($reason),
            'admin_disabled_was_published' => (bool) $row->is_published,
            'updated_at' => now(),
        ]);

        return new ServiceResult([
            'message' => 'Kuis berhasil dinonaktifkan oleh administrator.',
            'data' => [
                'id' => $quizId,
                'is_published' => false,
                'is_admin_disabled' => true,
                'admin_disabled_by' => $adminId,
                'admin_disabled_reason' => trim($reason),
            ],
        ]);
    }

    public function restore(int $quizId): ServiceResult
    {
        $row = $this->quizzes->findQuiz($quizId);

        if (!$row) {
            return ServiceResult::error('Kuis tidak ditemukan.', 404);
        }

        if ($row->admin_disabled_at === null) {
            return ServiceResult::error('Kuis tidak sedang dinonaktifkan oleh administrator.', 422);
        }

        $restorePublishedStatus = (bool) ($row->admin_disabled_was_published ?? false);

        $this->quizzes->updateQuiz($quizId, [
            'is_published' => $restorePublishedStatus,
            'admin_disabled_at' => null,
            'admin_disabled_by' => null,
            'admin_disabled_reason' => null,
            'admin_disabled_was_published' => null,
            'updated_at' => now(),
        ]);

        return new ServiceResult([
            'message' => 'Moderasi kuis berhasil dipulihkan.',
            'data' => [
                'id' => $quizId,
                'is_published' => $restorePublishedStatus,
                'is_admin_disabled' => false,
            ],
        ]);
    }
}
