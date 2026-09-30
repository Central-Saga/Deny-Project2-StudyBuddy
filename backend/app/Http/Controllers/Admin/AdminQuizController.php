<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminQuizController extends Controller
{
    /**
     * Daftar semua kuis untuk administrator.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'published',
                    'unpublished',
                    'admin_disabled',
                ]),
            ],
        ]);

        $query = DB::table('quizzes as q')
            ->leftJoin(
                'subjects as s',
                's.id',
                '=',
                'q.subject_id'
            )
            ->leftJoin(
                'users as creator',
                'creator.id',
                '=',
                'q.creator_id'
            )
            ->leftJoin(
                'users as moderator',
                'moderator.id',
                '=',
                'q.admin_disabled_by'
            );

        if (!empty($validated['search'])) {
            $search = strtolower(
                trim($validated['search'])
            );

            $like = "%{$search}%";

            $query->where(function ($query) use ($like) {
                $query
                    ->whereRaw(
                        'LOWER(q.title) LIKE ?',
                        [$like]
                    )
                    ->orWhereRaw(
                        'LOWER(COALESCE(q.description, \'\')) LIKE ?',
                        [$like]
                    )
                    ->orWhereRaw(
                        'LOWER(COALESCE(creator.name, \'\')) LIKE ?',
                        [$like]
                    )
                    ->orWhereRaw(
                        'LOWER(COALESCE(creator.email, \'\')) LIKE ?',
                        [$like]
                    )
                    ->orWhereRaw(
                        'LOWER(COALESCE(s.name, \'\')) LIKE ?',
                        [$like]
                    );
            });
        }

        $status = $validated['status'] ?? null;

        if ($status === 'published') {
            $query
                ->where('q.is_published', true)
                ->whereNull('q.admin_disabled_at');
        }

        if ($status === 'unpublished') {
            $query
                ->where('q.is_published', false)
                ->whereNull('q.admin_disabled_at');
        }

        if ($status === 'admin_disabled') {
            $query->whereNotNull(
                'q.admin_disabled_at'
            );
        }

        $quizzes = $query
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
            ])
            ->get();

        if ($quizzes->isEmpty()) {
            return response()->json([
                'message' =>
                    'Daftar kuis berhasil diambil.',
                'data' => [],
            ]);
        }

        $quizIds = $quizzes->pluck('id');

        $questionCounts = DB::table(
            'quiz_questions'
        )
            ->whereIn('quiz_id', $quizIds)
            ->selectRaw(
                'quiz_id, COUNT(*) as total'
            )
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');

        $attemptCounts = DB::table(
            'quiz_attempts'
        )
            ->whereIn('quiz_id', $quizIds)
            ->selectRaw(
                'quiz_id, COUNT(*) as total'
            )
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');

        $completedAttemptCounts = DB::table(
            'quiz_attempts'
        )
            ->whereIn('quiz_id', $quizIds)
            ->where('status', 'completed')
            ->selectRaw(
                'quiz_id, COUNT(*) as total'
            )
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');

        $data = $quizzes->map(
            function ($quiz) use (
                $questionCounts,
                $attemptCounts,
                $completedAttemptCounts
            ) {
                return [
                    'id' =>
                        (int) $quiz->id,

                    'creator_id' =>
                        (int) $quiz->creator_id,

                    'subject_id' =>
                        $quiz->subject_id !== null
                            ? (int) $quiz->subject_id
                            : null,

                    'title' =>
                        $quiz->title,

                    'slug' =>
                        $quiz->slug,

                    'description' =>
                        $quiz->description,

                    'duration_minutes' =>
                        $quiz->duration_minutes !== null
                            ? (int) $quiz->duration_minutes
                            : null,

                    'max_attempts' =>
                        $quiz->max_attempts !== null
                            ? (int) $quiz->max_attempts
                            : null,

                    'pass_score' =>
                        (int) $quiz->pass_score,

                    'is_published' =>
                        (bool) $quiz->is_published,

                    'is_admin_disabled' =>
                        $quiz->admin_disabled_at !== null,

                    'admin_disabled_at' =>
                        $quiz->admin_disabled_at,

                    'admin_disabled_by' =>
                        $quiz->admin_disabled_by !== null
                            ? (int) $quiz->admin_disabled_by
                            : null,

                    'admin_disabled_reason' =>
                        $quiz->admin_disabled_reason,

                    'admin_disabled_was_published' =>
                        $quiz->admin_disabled_was_published !== null
                            ? (bool) $quiz->admin_disabled_was_published
                            : null,

                    'moderator_name' =>
                        $quiz->moderator_name,

                    'subject' => [
                        'id' =>
                            $quiz->subject_id !== null
                                ? (int) $quiz->subject_id
                                : null,
                        'name' =>
                            $quiz->subject_name,
                        'code' =>
                            $quiz->subject_code,
                    ],

                    'creator' => [
                        'id' =>
                            (int) $quiz->creator_id,
                        'name' =>
                            $quiz->creator_name,
                        'email' =>
                            $quiz->creator_email,
                    ],

                    'question_count' =>
                        (int) (
                            $questionCounts[
                                $quiz->id
                            ] ?? 0
                        ),

                    'attempt_count' =>
                        (int) (
                            $attemptCounts[
                                $quiz->id
                            ] ?? 0
                        ),

                    'completed_attempt_count' =>
                        (int) (
                            $completedAttemptCounts[
                                $quiz->id
                            ] ?? 0
                        ),

                    'created_at' =>
                        $quiz->created_at,

                    'updated_at' =>
                        $quiz->updated_at,
                ];
            }
        )->values();

        return response()->json([
            'message' =>
                'Daftar kuis berhasil diambil.',
            'data' => $data,
        ]);
    }

    /**
     * Detail kuis untuk administrator.
     * Admin dapat melihat jawaban benar untuk kebutuhan moderasi.
     */
    public function show(int $quiz): JsonResponse
    {
        $row = DB::table('quizzes as q')
            ->leftJoin(
                'subjects as s',
                's.id',
                '=',
                'q.subject_id'
            )
            ->leftJoin(
                'users as creator',
                'creator.id',
                '=',
                'q.creator_id'
            )
            ->leftJoin(
                'users as moderator',
                'moderator.id',
                '=',
                'q.admin_disabled_by'
            )
            ->where('q.id', $quiz)
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
                'moderator.email as moderator_email',
            ])
            ->first();

        if (!$row) {
            return response()->json([
                'message' =>
                    'Kuis tidak ditemukan.',
            ], 404);
        }

        $questions = DB::table(
            'quiz_questions'
        )
            ->where('quiz_id', $quiz)
            ->orderBy('order')
            ->orderBy('id')
            ->select([
                'id',
                'quiz_id',
                'question_text',
                'question_type',
                'points',
                'order',
            ])
            ->get();

        $questionIds = $questions->pluck('id');

        $options = collect();

        if ($questionIds->isNotEmpty()) {
            $options = DB::table(
                'quiz_options'
            )
                ->whereIn(
                    'quiz_question_id',
                    $questionIds
                )
                ->orderBy('id')
                ->select([
                    'id',
                    'quiz_question_id',
                    'option_text',
                    'is_correct',
                ])
                ->get()
                ->groupBy(
                    'quiz_question_id'
                );
        }

        $questionData = $questions
            ->map(function ($question) use (
                $options
            ) {
                return [
                    'id' =>
                        (int) $question->id,

                    'question_text' =>
                        $question->question_text,

                    'question_type' =>
                        $question->question_type,

                    'points' =>
                        (int) $question->points,

                    'order' =>
                        (int) $question->order,

                    'options' =>
                        $options
                            ->get(
                                $question->id,
                                collect()
                            )
                            ->map(
                                fn ($option) => [
                                    'id' =>
                                        (int) $option->id,
                                    'option_text' =>
                                        $option->option_text,
                                    'is_correct' =>
                                        (bool) $option->is_correct,
                                ]
                            )
                            ->values(),
                ];
            })
            ->values();

        $attemptSummary = DB::table(
            'quiz_attempts'
        )
            ->where('quiz_id', $quiz)
            ->selectRaw(
                "
                COUNT(*) as total_attempts,
                SUM(
                    CASE
                        WHEN status = 'completed'
                        THEN 1
                        ELSE 0
                    END
                ) as completed_attempts,
                SUM(
                    CASE
                        WHEN status = 'in_progress'
                        THEN 1
                        ELSE 0
                    END
                ) as in_progress_attempts,
                SUM(
                    CASE
                        WHEN status = 'timed_out'
                        THEN 1
                        ELSE 0
                    END
                ) as timed_out_attempts,
                AVG(
                    CASE
                        WHEN status = 'completed'
                        THEN score
                        ELSE NULL
                    END
                ) as average_score
                "
            )
            ->first();

        return response()->json([
            'message' =>
                'Detail kuis berhasil diambil.',

            'data' => [
                'id' =>
                    (int) $row->id,

                'creator_id' =>
                    (int) $row->creator_id,

                'subject_id' =>
                    $row->subject_id !== null
                        ? (int) $row->subject_id
                        : null,

                'title' =>
                    $row->title,

                'slug' =>
                    $row->slug,

                'description' =>
                    $row->description,

                'duration_minutes' =>
                    $row->duration_minutes !== null
                        ? (int) $row->duration_minutes
                        : null,

                'max_attempts' =>
                    $row->max_attempts !== null
                        ? (int) $row->max_attempts
                        : null,

                'pass_score' =>
                    (int) $row->pass_score,

                'is_published' =>
                    (bool) $row->is_published,

                'is_admin_disabled' =>
                    $row->admin_disabled_at !== null,

                'admin_disabled_at' =>
                    $row->admin_disabled_at,

                'admin_disabled_by' =>
                    $row->admin_disabled_by !== null
                        ? (int) $row->admin_disabled_by
                        : null,

                'admin_disabled_reason' =>
                    $row->admin_disabled_reason,

                'admin_disabled_was_published' =>
                    $row->admin_disabled_was_published !== null
                        ? (bool) $row->admin_disabled_was_published
                        : null,

                'moderator' =>
                    $row->admin_disabled_by !== null
                        ? [
                            'id' =>
                                (int) $row->admin_disabled_by,
                            'name' =>
                                $row->moderator_name,
                            'email' =>
                                $row->moderator_email,
                        ]
                        : null,

                'subject' => [
                    'id' =>
                        $row->subject_id !== null
                            ? (int) $row->subject_id
                            : null,
                    'name' =>
                        $row->subject_name,
                    'code' =>
                        $row->subject_code,
                ],

                'creator' => [
                    'id' =>
                        (int) $row->creator_id,
                    'name' =>
                        $row->creator_name,
                    'email' =>
                        $row->creator_email,
                ],

                'question_count' =>
                    $questionData->count(),

                'questions' =>
                    $questionData,

                'attempt_summary' => [
                    'total' =>
                        (int) (
                            $attemptSummary
                                ->total_attempts ?? 0
                        ),

                    'completed' =>
                        (int) (
                            $attemptSummary
                                ->completed_attempts ?? 0
                        ),

                    'in_progress' =>
                        (int) (
                            $attemptSummary
                                ->in_progress_attempts ?? 0
                        ),

                    'timed_out' =>
                        (int) (
                            $attemptSummary
                                ->timed_out_attempts ?? 0
                        ),

                    'average_score' =>
                        $attemptSummary
                                ->average_score !== null
                            ? round(
                                (float) $attemptSummary
                                    ->average_score,
                                2
                            )
                            : null,
                ],

                'created_at' =>
                    $row->created_at,

                'updated_at' =>
                    $row->updated_at,
            ],
        ]);
    }

    /**
     * Nonaktifkan kuis melalui moderasi admin.
     *
     * Status publish sebelumnya disimpan agar restore
     * dapat mengembalikan kondisi awal.
     */
    public function disable(
        Request $request,
        int $quiz
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'min:10',
                'max:500',
            ],
        ]);

        $row = DB::table('quizzes')
            ->where('id', $quiz)
            ->first();

        if (!$row) {
            return response()->json([
                'message' =>
                    'Kuis tidak ditemukan.',
            ], 404);
        }

        if ($row->admin_disabled_at !== null) {
            return response()->json([
                'message' =>
                    'Kuis sudah dinonaktifkan oleh administrator.',
            ], 422);
        }

        DB::table('quizzes')
            ->where('id', $quiz)
            ->update([
                'is_published' => false,

                'admin_disabled_at' =>
                    now(),

                'admin_disabled_by' =>
                    $request->user()->id,

                'admin_disabled_reason' =>
                    trim($validated['reason']),

                'admin_disabled_was_published' =>
                    (bool) $row->is_published,

                'updated_at' =>
                    now(),
            ]);

        return response()->json([
            'message' =>
                'Kuis berhasil dinonaktifkan oleh administrator.',

            'data' => [
                'id' => $quiz,
                'is_published' => false,
                'is_admin_disabled' => true,
                'admin_disabled_by' =>
                    (int) $request->user()->id,
                'admin_disabled_reason' =>
                    trim($validated['reason']),
            ],
        ]);
    }

    /**
     * Pulihkan kuis yang sebelumnya dinonaktifkan admin.
     *
     * is_published dikembalikan ke kondisi sebelum
     * tindakan moderasi dilakukan.
     */
    public function restore(
        Request $request,
        int $quiz
    ): JsonResponse {
        $row = DB::table('quizzes')
            ->where('id', $quiz)
            ->first();

        if (!$row) {
            return response()->json([
                'message' =>
                    'Kuis tidak ditemukan.',
            ], 404);
        }

        if ($row->admin_disabled_at === null) {
            return response()->json([
                'message' =>
                    'Kuis tidak sedang dinonaktifkan oleh administrator.',
            ], 422);
        }

        $restorePublishedStatus =
            (bool) (
                $row
                    ->admin_disabled_was_published
                ?? false
            );

        DB::table('quizzes')
            ->where('id', $quiz)
            ->update([
                'is_published' =>
                    $restorePublishedStatus,

                'admin_disabled_at' =>
                    null,

                'admin_disabled_by' =>
                    null,

                'admin_disabled_reason' =>
                    null,

                'admin_disabled_was_published' =>
                    null,

                'updated_at' =>
                    now(),
            ]);

        return response()->json([
            'message' =>
                'Moderasi kuis berhasil dipulihkan.',

            'data' => [
                'id' => $quiz,
                'is_published' =>
                    $restorePublishedStatus,
                'is_admin_disabled' => false,
            ],
        ]);
    }
}