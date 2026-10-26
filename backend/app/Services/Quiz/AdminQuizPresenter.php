<?php

namespace App\Services\Quiz;

use Illuminate\Support\Collection;

class AdminQuizPresenter
{
    private function nullableInt($value): ?int
    {
        return $value !== null ? (int) $value : null;
    }

    public function listItem($quiz, $questionCounts, $attemptCounts, $completedAttemptCounts): array
    {
        return [
            'id' => (int) $quiz->id,
            'creator_id' => (int) $quiz->creator_id,
            'subject_id' => $this->nullableInt($quiz->subject_id),
            'title' => $quiz->title,
            'slug' => $quiz->slug,
            'description' => $quiz->description,
            'duration_minutes' => $this->nullableInt($quiz->duration_minutes),
            'max_attempts' => $this->nullableInt($quiz->max_attempts),
            'pass_score' => (int) $quiz->pass_score,
            'is_published' => (bool) $quiz->is_published,
            'is_admin_disabled' => $quiz->admin_disabled_at !== null,
            'admin_disabled_at' => $quiz->admin_disabled_at,
            'admin_disabled_by' => $this->nullableInt($quiz->admin_disabled_by),
            'admin_disabled_reason' => $quiz->admin_disabled_reason,
            'admin_disabled_was_published' => $quiz->admin_disabled_was_published !== null
                ? (bool) $quiz->admin_disabled_was_published
                : null,
            'moderator_name' => $quiz->moderator_name,
            'subject' => [
                'id' => $this->nullableInt($quiz->subject_id),
                'name' => $quiz->subject_name,
                'code' => $quiz->subject_code,
            ],
            'creator' => [
                'id' => (int) $quiz->creator_id,
                'name' => $quiz->creator_name,
                'email' => $quiz->creator_email,
            ],
            'question_count' => (int) ($questionCounts[$quiz->id] ?? 0),
            'attempt_count' => (int) ($attemptCounts[$quiz->id] ?? 0),
            'completed_attempt_count' => (int) ($completedAttemptCounts[$quiz->id] ?? 0),
            'created_at' => $quiz->created_at,
            'updated_at' => $quiz->updated_at,
        ];
    }

    public function questions(Collection $questions, Collection $options): Collection
    {
        return $questions
            ->map(fn ($question) => [
                'id' => (int) $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'points' => (int) $question->points,
                'order' => (int) $question->order,
                'options' => $options
                    ->get($question->id, collect())
                    ->map(fn ($option) => [
                        'id' => (int) $option->id,
                        'option_text' => $option->option_text,
                        'is_correct' => (bool) $option->is_correct,
                    ])
                    ->values(),
            ])
            ->values();
    }

    public function detail($row, Collection $questionData, $attemptSummary): array
    {
        return [
            'id' => (int) $row->id,
            'creator_id' => (int) $row->creator_id,
            'subject_id' => $this->nullableInt($row->subject_id),
            'title' => $row->title,
            'slug' => $row->slug,
            'description' => $row->description,
            'duration_minutes' => $this->nullableInt($row->duration_minutes),
            'max_attempts' => $this->nullableInt($row->max_attempts),
            'pass_score' => (int) $row->pass_score,
            'is_published' => (bool) $row->is_published,
            'is_admin_disabled' => $row->admin_disabled_at !== null,
            'admin_disabled_at' => $row->admin_disabled_at,
            'admin_disabled_by' => $this->nullableInt($row->admin_disabled_by),
            'admin_disabled_reason' => $row->admin_disabled_reason,
            'admin_disabled_was_published' => $row->admin_disabled_was_published !== null
                ? (bool) $row->admin_disabled_was_published
                : null,
            'moderator' => $row->admin_disabled_by !== null
                ? [
                    'id' => (int) $row->admin_disabled_by,
                    'name' => $row->moderator_name,
                    'email' => $row->moderator_email,
                ]
                : null,
            'subject' => [
                'id' => $this->nullableInt($row->subject_id),
                'name' => $row->subject_name,
                'code' => $row->subject_code,
            ],
            'creator' => [
                'id' => (int) $row->creator_id,
                'name' => $row->creator_name,
                'email' => $row->creator_email,
            ],
            'question_count' => $questionData->count(),
            'questions' => $questionData,
            'attempt_summary' => [
                'total' => (int) ($attemptSummary->total_attempts ?? 0),
                'completed' => (int) ($attemptSummary->completed_attempts ?? 0),
                'in_progress' => (int) ($attemptSummary->in_progress_attempts ?? 0),
                'timed_out' => (int) ($attemptSummary->timed_out_attempts ?? 0),
                'average_score' => $attemptSummary->average_score !== null
                    ? round((float) $attemptSummary->average_score, 2)
                    : null,
            ],
            'created_at' => $row->created_at,
            'updated_at' => $row->updated_at,
        ];
    }
}
