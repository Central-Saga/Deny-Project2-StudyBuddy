<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuizController extends Controller
{
    public function index()
    {
        $quizzes = DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id')
            ->where('q.is_published', true)
            ->orderByDesc('q.created_at')
            ->select([
                'q.id',
                'q.creator_id',
                'q.subject_id',
                'q.title',
                'q.slug',
                'q.description',
                'q.duration_minutes',
                'q.pass_score',
                'q.is_published',
                'q.created_at',
                's.name as subject_name',
                'u.name as creator_name',
            ])
            ->get();

        return response()->json($this->attachQuizQuestions($quizzes));
    }

    public function show(int $quiz)
    {
        $row = DB::table('quizzes as q')
            ->leftJoin('subjects as s', 's.id', '=', 'q.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.creator_id')
            ->where('q.id', $quiz)
            ->where('q.is_published', true)
            ->select([
                'q.id',
                'q.creator_id',
                'q.subject_id',
                'q.title',
                'q.slug',
                'q.description',
                'q.duration_minutes',
                'q.pass_score',
                'q.is_published',
                'q.created_at',
                's.name as subject_name',
                'u.name as creator_name',
            ])
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        return response()->json($this->attachQuizQuestions(collect([$row]))[0]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'pass_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_published' => ['nullable', 'boolean'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.question_type' => ['required', 'in:multiple_choice,true_false,essay'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.option_text' => ['required', 'string', 'max:1000'],
            'questions.*.options.*.is_correct' => ['nullable', 'boolean'],
        ]);

        foreach ($validated['questions'] as $index => $question) {
            if ($question['question_type'] !== 'essay') {
                $options = $question['options'] ?? [];
                $correctCount = collect($options)->where('is_correct', true)->count();
                if (count($options) < 2 || $correctCount !== 1) {
                    return response()->json([
                        'message' => "Pertanyaan ke-" . ($index + 1) . " harus memiliki minimal 2 opsi dan tepat 1 jawaban benar.",
                    ], 422);
                }

                if ($question['question_type'] === 'true_false' && count($options) !== 2) {
                    return response()->json([
                        'message' => "Pertanyaan true/false ke-" . ($index + 1) . " harus memiliki tepat 2 opsi.",
                    ], 422);
                }
            }
        }

        $quizId = DB::transaction(function () use ($validated, $request) {
            $now = now();
            $baseSlug = Str::slug($validated['title']) ?: 'quiz';
            $slug = $baseSlug;
            $suffix = 2;

            while (DB::table('quizzes')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $suffix++;
            }

            $id = DB::table('quizzes')->insertGetId([
                'creator_id' => $request->user()->id,
                'subject_id' => $validated['subject_id'] ?? null,
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'duration_minutes' => $validated['duration_minutes'] ?? null,
                'pass_score' => $validated['pass_score'] ?? 70,
                'is_published' => $validated['is_published'] ?? true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($validated['questions'] as $order => $question) {
                $questionId = DB::table('quiz_questions')->insertGetId([
                    'quiz_id' => $id,
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

            return $id;
        });

        return response()->json([
            'message' => 'Kuis berhasil dibuat.',
            'data' => $this->getQuizPayload($quizId, true),
        ], 201);
    }

    public function start(int $quiz, Request $request)
    {
        $quizRow = DB::table('quizzes')->where('id', $quiz)->where('is_published', true)->first();

        if (!$quizRow) {
            return response()->json(['message' => 'Kuis tidak ditemukan.'], 404);
        }

        $existing = DB::table('quiz_attempts')
            ->where('quiz_id', $quiz)
            ->where('user_id', $request->user()->id)
            ->where('status', 'in_progress')
            ->orderByDesc('id')
            ->first();

        if ($existing) {
            return response()->json([
                'attempt_id' => $existing->id,
                'quiz_id' => $quiz,
                'started_at' => $existing->started_at,
                'status' => $existing->status,
            ]);
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
            : DB::table('quiz_options')->whereIn('id', $selectedOptionIds)->get()->keyBy('id');

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
        $score = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;

        DB::table('quiz_attempts')
            ->where('id', $attempt)
            ->update([
                'score' => $score,
                'total_points' => $totalPoints,
                'completed_at' => now(),
                'status' => 'completed',
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Kuis berhasil dikumpulkan.',
            'attempt_id' => $attempt,
            'earned_points' => $earnedPoints,
            'total_points' => $totalPoints,
            'score' => $score,
            'pass_score' => (int) $quizRow->pass_score,
            'passed' => $score >= (int) $quizRow->pass_score,
        ]);
    }

    private function attachQuizQuestions($quizzes)
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
                ->select(['id', 'quiz_question_id', 'option_text'])
                ->get();

        $optionsByQuestion = $options->groupBy('quiz_question_id');
        $questionsByQuiz = $questions->groupBy('quiz_id');

        return collect($quizzes)->map(function ($quiz) use ($questionsByQuiz, $optionsByQuestion) {
            $questions = $questionsByQuiz->get($quiz->id, collect())->map(function ($question) use ($optionsByQuestion) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => (int) $question->points,
                    'order' => (int) $question->order,
                    'options' => $optionsByQuestion->get($question->id, collect())->values()->map(fn ($option) => [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                    ])->values(),
                ];
            })->values();

            return [
                'id' => $quiz->id,
                'creator_id' => $quiz->creator_id,
                'subject_id' => $quiz->subject_id,
                'title' => $quiz->title,
                'slug' => $quiz->slug,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'pass_score' => (int) $quiz->pass_score,
                'is_published' => (bool) $quiz->is_published,
                'created_at' => $quiz->created_at,
                'subject_name' => $quiz->subject_name,
                'creator_name' => $quiz->creator_name,
                'question_count' => $questions->count(),
                'questions' => $questions,
            ];
        })->values();
    }

    private function getQuizPayload(int $quizId, bool $includeCreator = false): array
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
                'q.pass_score',
                'q.is_published',
                'q.created_at',
                's.name as subject_name',
                'u.name as creator_name',
            ])
            ->first();

        if (!$row) {
            return [];
        }

        return $this->attachQuizQuestions(collect([$row]))->first();
    }
}
