<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $status = $validated['status'] ?? 'active';
        $userId = (int) $request->user()->id;

        $quizzes = DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id')
            ->when(
                $status === 'inactive',
                fn ($query) => $query
                    ->where('q.is_published', false)
                    ->where('q.creator_id', $userId),
                fn ($query) => $query->where('q.is_published', true)
            )
            ->orderByDesc('q.updated_at')
            ->select([
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
            ])
            ->get();

        return response()->json(
            $this->attachQuizQuestions($quizzes, $userId, false)
        );
    }

    public function show(int $quiz, Request $request)
    {
        $userId = $request->user()->id;

        $row = DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id')
            ->where('q.id', $quiz)
            ->where(function ($query) use ($userId) {
                $query->where('q.is_published', true)
                    ->orWhere('q.creator_id', $userId);
            })
            ->select([
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
            ])
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        return response()->json(
            $this->attachQuizQuestions(collect([$row]), $userId, true)->first()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->quizValidationRules(true));

        if ($error = $this->validateQuestionStructure($validated['questions'])) {
            return $error;
        }

        $quizId = DB::transaction(function () use ($validated, $request) {
            $now = now();
            $slug = $this->uniqueSlug($validated['title']);

            $id = DB::table('quizzes')->insertGetId([
                'creator_id' => $request->user()->id,
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

            $this->insertQuestions($id, $validated['questions'], $now);

            return $id;
        });

        return response()->json([
            'message' => 'Kuis berhasil dibuat.',
            'data' => $this->getQuizPayload($quizId, $request->user()->id, true),
        ], 201);
    }

    public function update(int $quiz, Request $request)
    {
        $quizRow = DB::table('quizzes')->where('id', $quiz)->first();

        if (!$quizRow) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        if ((int) $quizRow->creator_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Kamu hanya dapat mengedit kuis milikmu sendiri.',
            ], 403);
        }

        $validated = $request->validate($this->quizValidationRules(false));

        if (array_key_exists('questions', $validated)) {
            if ($error = $this->validateQuestionStructure($validated['questions'])) {
                return $error;
            }

            $hasAttempts = DB::table('quiz_attempts')
                ->where('quiz_id', $quiz)
                ->exists();

            if ($hasAttempts) {
                return response()->json([
                    'message' => 'Soal tidak dapat diubah karena kuis ini sudah memiliki riwayat percobaan. Kamu masih dapat mengubah judul, deskripsi, mata kuliah, durasi, nilai lulus, dan batas percobaan.',
                ], 422);
            }
        }

        if (array_key_exists('max_attempts', $validated) && $validated['max_attempts'] !== null) {
            $usedAttempts = DB::table('quiz_attempts')
                ->where('quiz_id', $quiz)
                ->whereIn('status', ['completed', 'timed_out'])
                ->count();

            if ((int) $validated['max_attempts'] < $usedAttempts) {
                return response()->json([
                    'message' => 'Batas percobaan tidak boleh lebih kecil dari jumlah percobaan yang sudah selesai.',
                ], 422);
            }
        }

        DB::transaction(function () use ($quiz, $quizRow, $validated) {
            $now = now();
            $updates = [];

            foreach (['subject_id', 'title', 'description', 'duration_minutes', 'max_attempts', 'pass_score', 'is_published'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $updates[$field] = $validated[$field];
                }
            }

            if (array_key_exists('title', $validated) && $validated['title'] !== $quizRow->title) {
                $updates['slug'] = $this->uniqueSlug($validated['title'], $quiz);
            }

            if (!empty($updates)) {
                $updates['updated_at'] = $now;
                DB::table('quizzes')->where('id', $quiz)->update($updates);
            }

            if (array_key_exists('questions', $validated)) {
                DB::table('quiz_questions')->where('quiz_id', $quiz)->delete();
                $this->insertQuestions($quiz, $validated['questions'], $now);
            }
        });

        return response()->json([
            'message' => 'Kuis berhasil diperbarui.',
            'data' => $this->getQuizPayload($quiz, $request->user()->id, true),
        ]);
    }

    /**
     * Logical delete: kuis tidak dihapus permanen agar attempt/jawaban tetap tersimpan.
     */
    public function destroy(int $quiz, Request $request)
    {
        $quizRow = DB::table('quizzes')->where('id', $quiz)->first();

        if (!$quizRow) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        if ((int) $quizRow->creator_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Kamu hanya dapat menonaktifkan kuis milikmu sendiri.',
            ], 403);
        }

        if (!$quizRow->is_published) {
            return response()->json([
                'message' => 'Kuis sudah dalam keadaan nonaktif.',
            ]);
        }

        DB::table('quizzes')
            ->where('id', $quiz)
            ->update([
                'is_published' => false,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Kuis berhasil dinonaktifkan. Riwayat pengerjaan tetap disimpan.',
        ]);
    }

    public function start(int $quiz, Request $request)
    {
        $quizRow = DB::table('quizzes')
            ->where('id', $quiz)
            ->where('is_published', true)
            ->first();

        if (!$quizRow) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        $existing = DB::table('quiz_attempts')
            ->where('quiz_id', $quiz)
            ->where('user_id', $request->user()->id)
            ->where('status', 'in_progress')
            ->orderByDesc('id')
            ->first();

        $usedAttempts = DB::table('quiz_attempts')
            ->where('quiz_id', $quiz)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['completed', 'timed_out'])
            ->count();

        if ($existing) {
            return response()->json([
                'attempt_id' => $existing->id,
                'quiz_id' => $quiz,
                'started_at' => $existing->started_at,
                'status' => $existing->status,
                'max_attempts' => $quizRow->max_attempts !== null ? (int) $quizRow->max_attempts : null,
                'attempts_used' => $usedAttempts,
                'attempts_remaining' => $quizRow->max_attempts !== null
                    ? max(0, (int) $quizRow->max_attempts - $usedAttempts)
                    : null,
                'can_attempt' => true,
            ]);
        }

        if ($quizRow->max_attempts !== null && $usedAttempts >= (int) $quizRow->max_attempts) {
            return response()->json([
                'message' => 'Batas percobaan kuis telah tercapai.',
                'max_attempts' => (int) $quizRow->max_attempts,
                'attempts_used' => $usedAttempts,
                'attempts_remaining' => 0,
                'can_attempt' => false,
            ], 422);
        }

        $totalPoints = (int) DB::table('quiz_questions')
            ->where('quiz_id', $quiz)
            ->sum('points');

        $attemptId = DB::table('quiz_attempts')->insertGetId([
            'quiz_id' => $quiz,
            'user_id' => $request->user()->id,
            'score' => null,
            'total_points' => $totalPoints,
            'started_at' => now(),
            'completed_at' => null,
            'status' => 'in_progress',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $attempt = DB::table('quiz_attempts')->where('id', $attemptId)->first();

        return response()->json([
            'attempt_id' => $attempt->id,
            'quiz_id' => $quiz,
            'started_at' => $attempt->started_at,
            'status' => $attempt->status,
            'max_attempts' => $quizRow->max_attempts !== null ? (int) $quizRow->max_attempts : null,
            'attempts_used' => $usedAttempts,
            'attempts_remaining' => $quizRow->max_attempts !== null
                ? max(0, (int) $quizRow->max_attempts - $usedAttempts)
                : null,
            'can_attempt' => true,
        ], 201);
    }

    public function submit(int $quiz, int $attempt, Request $request)
    {
        $validated = $request->validate([
            'answers' => ['nullable', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.option_id' => ['nullable', 'integer'],
            'answers.*.answer_text' => ['nullable', 'string'],
        ]);

        $attemptRow = DB::table('quiz_attempts')
            ->where('id', $attempt)
            ->where('quiz_id', $quiz)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$attemptRow) {
            return response()->json(['message' => 'Percobaan kuis tidak ditemukan.'], 404);
        }

        if ($attemptRow->status !== 'in_progress') {
            return response()->json(['message' => 'Kuis ini sudah dikumpulkan.'], 422);
        }

        $quizRow = DB::table('quizzes')->where('id', $quiz)->first();
        if (!$quizRow) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        $questions = DB::table('quiz_questions')
            ->where('quiz_id', $quiz)
            ->orderBy('order')
            ->get();

        $answerMap = collect($validated['answers'] ?? [])->keyBy('question_id');
        $selectedOptionIds = collect($validated['answers'] ?? [])
            ->pluck('option_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values();

        $options = $selectedOptionIds->isEmpty()
            ? collect()
            : DB::table('quiz_options')
                ->whereIn('id', $selectedOptionIds)
                ->get()
                ->keyBy('id');

        $earnedPoints = 0;
        $now = now();

        DB::transaction(function () use ($questions, $answerMap, $options, $attempt, &$earnedPoints, $now) {
            DB::table('quiz_answers')->where('quiz_attempt_id', $attempt)->delete();

            foreach ($questions as $question) {
                $answer = $answerMap->get((string) $question->id) ?? $answerMap->get($question->id);
                $option = null;
                $isCorrect = null;
                $pointsAwarded = 0;
                $answerText = $answer['answer_text'] ?? null;
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

                DB::table('quiz_answers')->insert([
                    'quiz_attempt_id' => $attempt,
                    'quiz_question_id' => $question->id,
                    'quiz_option_id' => $option ? $option->id : null,
                    'answer_text' => $answerText,
                    'is_correct' => $isCorrect,
                    'points_awarded' => $pointsAwarded,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });

        $totalPoints = (int) $questions->sum('points');
        $score = $totalPoints > 0
            ? (int) round(($earnedPoints / $totalPoints) * 100)
            : 0;

        DB::table('quiz_attempts')
            ->where('id', $attempt)
            ->update([
                'score' => $score,
                'total_points' => $totalPoints,
                'completed_at' => now(),
                'status' => 'completed',
                'updated_at' => now(),
            ]);

        $usedAttempts = DB::table('quiz_attempts')
            ->where('quiz_id', $quiz)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['completed', 'timed_out'])
            ->count();

        $maxAttempts = $quizRow->max_attempts !== null ? (int) $quizRow->max_attempts : null;
        $remainingAttempts = $maxAttempts !== null
            ? max(0, $maxAttempts - $usedAttempts)
            : null;

        $questionIds = $questions->pluck('id')->values();
        $allOptions = $questionIds->isEmpty()
            ? collect()
            : DB::table('quiz_options')
                ->whereIn('quiz_question_id', $questionIds)
                ->get();

        $optionsById = $allOptions->keyBy('id');
        $correctOptionsByQuestion = $allOptions
            ->where('is_correct', true)
            ->keyBy('quiz_question_id');

        $storedAnswers = DB::table('quiz_answers')
            ->where('quiz_attempt_id', $attempt)
            ->get()
            ->keyBy('quiz_question_id');

        $review = $questions->map(function ($question) use (
            $storedAnswers,
            $optionsById,
            $correctOptionsByQuestion
        ) {
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

        return response()->json([
            'message' => 'Kuis berhasil dikumpulkan.',
            'attempt_id' => $attempt,
            'earned_points' => $earnedPoints,
            'total_points' => $totalPoints,
            'score' => $score,
            'pass_score' => (int) $quizRow->pass_score,
            'passed' => $score >= (int) $quizRow->pass_score,
            'max_attempts' => $maxAttempts,
            'attempts_used' => $usedAttempts,
            'attempts_remaining' => $remainingAttempts,
            'can_attempt' => $maxAttempts === null || $usedAttempts < $maxAttempts,
            'review' => $review,
        ]);
    }

    private function quizValidationRules(bool $questionsRequired): array
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

    private function validateQuestionStructure(array $questions)
    {
        foreach ($questions as $index => $question) {
            if ($question['question_type'] === 'essay') {
                continue;
            }

            $options = $question['options'] ?? [];
            $correctCount = collect($options)->where('is_correct', true)->count();

            if (count($options) < 2 || $correctCount !== 1) {
                return response()->json([
                    'message' => 'Pertanyaan ke-' . ($index + 1) . ' harus memiliki minimal 2 opsi dan tepat 1 jawaban benar.',
                ], 422);
            }

            if ($question['question_type'] === 'true_false' && count($options) !== 2) {
                return response()->json([
                    'message' => 'Pertanyaan true/false ke-' . ($index + 1) . ' harus memiliki tepat 2 opsi.',
                ], 422);
            }
        }

        return null;
    }

    private function insertQuestions(int $quizId, array $questions, $now): void
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

    private function uniqueSlug(string $title, ?int $ignoreQuizId = null): string
    {
        $baseSlug = Str::slug($title) ?: 'quiz';
        $slug = $baseSlug;
        $suffix = 2;

        while (
            DB::table('quizzes')
                ->where('slug', $slug)
                ->when($ignoreQuizId, fn ($query) => $query->where('id', '!=', $ignoreQuizId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $suffix++;
        }

        return $slug;
    }

    private function attachQuizQuestions($quizzes, ?int $viewerId = null, bool $includeCorrectForOwner = false)
    {
        $quizIds = collect($quizzes)->pluck('id')->values();
        if ($quizIds->isEmpty()) {
            return collect();
        }

        $questions = DB::table('quiz_questions')
            ->whereIn('quiz_id', $quizIds)
            ->orderBy('order')
            ->get();

        $questionIds = $questions->pluck('id')->values();
        $options = $questionIds->isEmpty()
            ? collect()
            : DB::table('quiz_options')
                ->whereIn('quiz_question_id', $questionIds)
                ->select(['id', 'quiz_question_id', 'option_text', 'is_correct'])
                ->get();

        $attemptCounts = DB::table('quiz_attempts')
            ->whereIn('quiz_id', $quizIds)
            ->select('quiz_id', DB::raw('COUNT(*) as total'))
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');

        $viewerAttemptCounts = collect();
        $viewerInProgressQuizIds = collect();

        if ($viewerId !== null) {
            $viewerAttemptCounts = DB::table('quiz_attempts')
                ->whereIn('quiz_id', $quizIds)
                ->where('user_id', $viewerId)
                ->whereIn('status', ['completed', 'timed_out'])
                ->select('quiz_id', DB::raw('COUNT(*) as total'))
                ->groupBy('quiz_id')
                ->pluck('total', 'quiz_id');

            $viewerInProgressQuizIds = DB::table('quiz_attempts')
                ->whereIn('quiz_id', $quizIds)
                ->where('user_id', $viewerId)
                ->where('status', 'in_progress')
                ->pluck('quiz_id');
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

            $questions = $questionsByQuiz->get($quiz->id, collect())->map(function ($question) use (
                $optionsByQuestion,
                $canManage,
                $includeCorrectForOwner
            ) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => (int) $question->points,
                    'order' => (int) $question->order,
                    'options' => $optionsByQuestion->get($question->id, collect())
                        ->values()
                        ->map(function ($option) use ($canManage, $includeCorrectForOwner) {
                            $payload = [
                                'id' => $option->id,
                                'option_text' => $option->option_text,
                            ];

                            if ($canManage && $includeCorrectForOwner) {
                                $payload['is_correct'] = (bool) $option->is_correct;
                            }

                            return $payload;
                        })
                        ->values(),
                ];
            })->values();

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

    private function getQuizPayload(int $quizId, ?int $viewerId = null, bool $includeCorrectForOwner = false): array
    {
        $row = DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id')
            ->where('q.id', $quizId)
            ->select([
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
            ])
            ->first();

        if (!$row) {
            return [];
        }

        return $this->attachQuizQuestions(
            collect([$row]),
            $viewerId,
            $includeCorrectForOwner
        )->first() ?? [];
    }
}
