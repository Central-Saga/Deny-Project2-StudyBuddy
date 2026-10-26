<?php

namespace App\Services\Buddy;

use App\Models\User;
use Illuminate\Support\Collection;

class BuddyScorer
{
    /**
     * Susun kriteria matching dari profil user dan filter manual.
     * Filter manual hanya mengganti dimensi yang dipilih user.
     */
    public function buildCriteria(User $currentUser, array $validated): array
    {
        $profileSubjectIds = $currentUser->userSubjects
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $profileLearningStyles = $this->normalizeStyles(
            $currentUser->learning_styles ?? []
        );

        $profileAvailabilityWindows = $currentUser->availabilities
            ->map(fn ($availability) => [
                'day_of_week' => (int) $availability->day_of_week,
                'start_time' => substr((string) $availability->start_time, 0, 5),
                'end_time' => substr((string) $availability->end_time, 0, 5),
            ])
            ->values();

        $requestedSubjectIds = collect($validated['subject_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $requestedLearningStyles = $this->normalizeStyles(
            $validated['learning_styles'] ?? []
        );

        $hasScheduleFilter =
            isset($validated['day_of_week']) &&
            isset($validated['start_time']) &&
            isset($validated['end_time']);

        $requestedAvailabilityWindows = $hasScheduleFilter
            ? collect([[
                'day_of_week' => (int) $validated['day_of_week'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]])
            : collect();

        $subjectIds = $requestedSubjectIds->isNotEmpty()
            ? $requestedSubjectIds
            : $profileSubjectIds;

        $learningStyles = $requestedLearningStyles->isNotEmpty()
            ? $requestedLearningStyles
            : $profileLearningStyles;

        $availabilityWindows = $requestedAvailabilityWindows->isNotEmpty()
            ? $requestedAvailabilityWindows
            : $profileAvailabilityWindows;

        $hasExplicitFilter =
            $requestedSubjectIds->isNotEmpty() ||
            $requestedLearningStyles->isNotEmpty() ||
            $hasScheduleFilter;

        $hasProfileCriteria =
            $profileSubjectIds->isNotEmpty() ||
            $profileLearningStyles->isNotEmpty() ||
            $profileAvailabilityWindows->isNotEmpty();

        $hasCriteria =
            $subjectIds->isNotEmpty() ||
            $learningStyles->isNotEmpty() ||
            $availabilityWindows->isNotEmpty();

        return [
            'subject_ids' => $subjectIds,
            'learning_styles' => $learningStyles,
            'availability_windows' => $availabilityWindows,
            'requested_subject_ids' => $requestedSubjectIds,
            'has_schedule_filter' => $hasScheduleFilter,
            'has_explicit_filter' => $hasExplicitFilter,
            'has_profile_criteria' => $hasProfileCriteria,
            'has_criteria' => $hasCriteria,
        ];
    }

    public function score(User $buddy, array $criteria): void
    {
        $scoreSubjectIds = $criteria['subject_ids'];
        $scoreLearningStyles = $criteria['learning_styles'];
        $scoreAvailabilityWindows = $criteria['availability_windows'];

        $matchedSubjects = $scoreSubjectIds->isEmpty()
            ? collect()
            : $buddy->userSubjects
                ->whereIn('subject_id', $scoreSubjectIds->all())
                ->map(function ($userSubject) {
                    if (!$userSubject->subject) {
                        return null;
                    }

                    return [
                        'id' => $userSubject->subject->id,
                        'code' => $userSubject->subject->code,
                        'name' => $userSubject->subject->name,
                    ];
                })
                ->filter()
                ->unique('id')
                ->values();

        $learningStyleMatch =
            $scoreLearningStyles->isNotEmpty() &&
            collect($buddy->learning_styles ?? [])
                ->intersect($scoreLearningStyles)
                ->isNotEmpty();

        $availabilityMatch =
            $scoreAvailabilityWindows->isNotEmpty() &&
            $buddy->availabilities->contains(
                function ($buddyAvailability) use ($scoreAvailabilityWindows) {
                    $buddyDay = (int) $buddyAvailability->day_of_week;
                    $buddyStart = substr(
                        (string) $buddyAvailability->start_time,
                        0,
                        5
                    );
                    $buddyEnd = substr(
                        (string) $buddyAvailability->end_time,
                        0,
                        5
                    );

                    return $scoreAvailabilityWindows->contains(
                        fn ($window) =>
                            $buddyDay === (int) $window['day_of_week'] &&
                            $buddyStart < $window['end_time'] &&
                            $buddyEnd > $window['start_time']
                    );
                }
            );

        $matchScore = $matchedSubjects->count();

        if ($availabilityMatch) {
            $matchScore++;
        }

        if ($learningStyleMatch) {
            $matchScore++;
        }

        $buddy->setAttribute('match_score', $matchScore);
        $buddy->setAttribute('matched_subjects', $matchedSubjects->all());
        $buddy->setAttribute('availability_match', $availabilityMatch);
        $buddy->setAttribute('learning_style_match', $learningStyleMatch);
    }

    public function sort(Collection $buddies, bool $hasCriteria): Collection
    {
        if (!$hasCriteria) {
            return $buddies
                ->sortBy(fn ($buddy) => strtolower($buddy->name))
                ->values();
        }

        return $buddies
            ->sort(function ($a, $b) {
                $aScore = (int) ($a->match_score ?? 0);
                $bScore = (int) ($b->match_score ?? 0);

                if ($aScore !== $bScore) {
                    return $bScore <=> $aScore;
                }

                $aActive = $a->last_active_at?->getTimestamp() ?? 0;
                $bActive = $b->last_active_at?->getTimestamp() ?? 0;

                if ($aActive !== $bActive) {
                    return $bActive <=> $aActive;
                }

                return strcasecmp($a->name, $b->name);
            })
            ->values();
    }

    private function normalizeStyles(iterable $styles): Collection
    {
        return collect($styles)
            ->map(fn ($style) => trim((string) $style))
            ->filter()
            ->unique()
            ->values();
    }
}
