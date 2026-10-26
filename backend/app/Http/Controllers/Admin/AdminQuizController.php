<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminQuizService;
use App\Services\Quiz\ServiceResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminQuizController extends Controller
{
    public function __construct(private AdminQuizService $adminQuizService)
    {
    }

    /**
     * Daftar semua kuis untuk administrator.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in(['published', 'unpublished', 'admin_disabled']),
            ],
        ]);

        return $this->respond(
            $this->adminQuizService->list(
                $validated['search'] ?? null,
                $validated['status'] ?? null
            )
        );
    }

    /**
     * Detail kuis untuk administrator.
     * Admin dapat melihat jawaban benar untuk kebutuhan moderasi.
     */
    public function show(int $quiz): JsonResponse
    {
        return $this->respond($this->adminQuizService->show($quiz));
    }

    /**
     * Nonaktifkan kuis melalui moderasi admin.
     *
     * Status publish sebelumnya disimpan agar restore
     * dapat mengembalikan kondisi awal.
     */
    public function disable(Request $request, int $quiz): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        return $this->respond(
            $this->adminQuizService->disable($quiz, (int) $request->user()->id, $validated['reason'])
        );
    }

    /**
     * Pulihkan kuis yang sebelumnya dinonaktifkan admin.
     *
     * is_published dikembalikan ke kondisi sebelum
     * tindakan moderasi dilakukan.
     */
    public function restore(Request $request, int $quiz): JsonResponse
    {
        return $this->respond($this->adminQuizService->restore($quiz));
    }

    private function respond(ServiceResult $result): JsonResponse
    {
        return response()->json($result->body, $result->status);
    }
}
