<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BuddyUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->resource->relationLoaded('profile')
            ? $this->profile
            : null;

        $avatarUrl = null;
        $avatar = $profile?->avatar_url;

        if ($avatar) {
            if (
                str_starts_with($avatar, 'http://') ||
                str_starts_with($avatar, 'https://')
            ) {
                $avatarUrl = $avatar;
            } else {
                $avatarUrl = url(
                    Storage::disk('public')->url($avatar)
                );
            }
        }

        $subjects = [];

        if ($this->resource->relationLoaded('userSubjects')) {
            $subjects = $this->userSubjects
                ->where('type', 'learning')
                ->map(function ($userSubject) {
                    if (
                        !$userSubject->relationLoaded('subject') ||
                        !$userSubject->subject
                    ) {
                        return null;
                    }

                    return [
                        'id' => $userSubject->subject->id,
                        'code' => $userSubject->subject->code,
                        'name' => $userSubject->subject->name,
                        'proficiency_level' => $userSubject->proficiency_level,
                        'type' => $userSubject->type,
                    ];
                })
                ->filter()
                ->values()
                ->all();
        }

        $availabilities = [];

        if ($this->resource->relationLoaded('availabilities')) {
            $availabilities = $this->availabilities
                ->map(fn ($availability) => [
                    'id' => $availability->id,
                    'day_of_week' => $availability->day_of_week,
                    'start_time' => $availability->start_time,
                    'end_time' => $availability->end_time,
                    'timezone' => $availability->timezone,
                    'is_recurring' => (bool) $availability->is_recurring,
                ])
                ->values()
                ->all();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            'course' => $this->course,
            'skills' => $this->skills ?? [],
            'learning_styles' => $this->learning_styles ?? [],
            'subjects' => $subjects,
            'availabilities' => $availabilities,
            'last_active_at' => $this->last_active_at?->toIso8601String(),

            'match_score' => (int) ($this->match_score ?? 0),
            'matched_subjects' => $this->matched_subjects ?? [],
            'availability_match' => (bool) ($this->availability_match ?? false),
            'learning_style_match' => (bool) ($this->learning_style_match ?? false),

            'bio' => $profile?->bio ?? $this->bio,

            'profile' => $profile ? [
                'avatar_url' => $avatarUrl,
                'bio' => $profile->bio,
                'phone_number' => $profile->phone_number,
                'university' => $profile->university,
                'major' => $profile->major,
                'github_url' => $profile->github_url,
                'linkedin_url' => $profile->linkedin_url,
            ] : null,

            'is_connected' => (bool) ($this->is_connected ?? false),
            'connection_id' => $this->connection_id ?? null,
            'connection_status' => $this->connection_status ?? null,
            'connection_direction' => $this->connection_direction ?? null,
        ];
    }
}
