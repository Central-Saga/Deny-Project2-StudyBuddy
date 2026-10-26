<?php

namespace App\Http\Controllers;

use App\Services\Quiz\QuizQuestionService;
use App\Services\Quiz\ServiceResult;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function __construct(private QuizService $quizService)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        return response()->json(
            $this->quizService->list(
                $validated['status'] ?? 'active',
                (int) $request->user()->id
            )
        );
    }

    public function show(int $quiz, Request $request)
    {
        return $this->respond(
            $this->quizService->show($quiz, $request->user()->id)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate(QuizQuestionService::validationRules(true));

        return $this->respond(
            $this->quizService->create($validated, $request->user()->id)
        );
    }

    public function update(int $quiz, Request $request)
    {
        $quizRow = $this->quizService->findOwnedForUpdate(
            $quiz,
            (int) $request->user()->id,
            'Kamu hanya dapat mengedit kuis milikmu sendiri.'
        );

        if ($quizRow instanceof ServiceResult) {
            return $this->respond($quizRow);
        }

        // Request harus divalidasi sebelum $validated digunakan.
        $validated = $request->validate(QuizQuestionService::validationRules(false));

        return $this->respond(
            $this->quizService->update($quiz, $request->user()->id, $validated, $quizRow)
        );
    }

    /**
     * Logical delete: kuis tidak dihapus permanen agar attempt/jawaban tetap tersimpan.
     */
    public function destroy(int $quiz, Request $request)
    {
        return $this->respond(
            $this->quizService->deactivate($quiz, (int) $request->user()->id)
        );
    }

    public function start(int $quiz, Request $request)
    {
        return $this->respond(
            $this->quizService->start($quiz, $request->user()->id)
        );
    }

    public function submit(int $quiz, int $attempt, Request $request)
    {
        $validated = $request->validate(QuizQuestionService::attemptRules());

        return $this->respond(
            $this->quizService->submit($quiz, $attempt, $request->user()->id, $validated)
        );
    }

    private function respond(ServiceResult $result): JsonResponse
    {
        return response()->json($result->body, $result->status);
    }
}
