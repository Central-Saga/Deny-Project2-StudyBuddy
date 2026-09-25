<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        $profile =
            $this->resource->relationLoaded(
                'profile'
            )
                ? $this->profile
                : null;

        /*
         * Avatar URL
         */
        $avatar =
            $profile?->avatar_url;

        $avatarUrl = null;

        if ($avatar) {
            if (
                str_starts_with(
                    $avatar,
                    'http://'
                ) ||
                str_starts_with(
                    $avatar,
                    'https://'
                )
            ) {
                $avatarUrl = $avatar;
            } else {
                $avatarUrl = url(
                    Storage::disk('public')
                        ->url($avatar)
                );
            }
        }

        /*
         * Subjects hanya diproses jika
         * relasi sudah di-load.
         *
         * Ini mencegah query tambahan
         * ketika UserResource dipakai
         * pada Group atau Session.
         */
        $subjects = [];

        if (
            $this->resource->relationLoaded(
                'userSubjects'
            )
        ) {
            $subjects =
                $this->userSubjects
                    ->where(
                        'type',
                        'learning'
                    )
                    ->map(
                        function ($userSubject) {
                            if (
                                !$userSubject
                                    ->relationLoaded(
                                        'subject'
                                    ) ||
                                !$userSubject->subject
                            ) {
                                return null;
                            }

                            return [
                                'id' =>
                                    $userSubject
                                        ->subject
                                        ->id,

                                'code' =>
                                    $userSubject
                                        ->subject
                                        ->code,

                                'name' =>
                                    $userSubject
                                        ->subject
                                        ->name,

                                'proficiency_level' =>
                                    $userSubject
                                        ->proficiency_level,

                                'type' =>
                                    $userSubject->type,
                            ];
                        }
                    )
                    ->filter()
                    ->values()
                    ->all();
        }

        /*
         * Availability hanya dikirim
         * jika relasi sudah di-load.
         */
        $availabilities = [];

        if (
            $this->resource->relationLoaded(
                'availabilities'
            )
        ) {
            $availabilities =
                $this->availabilities
                    ->map(
                        fn ($availability) => [
                            'id' =>
                                $availability->id,

                            'day_of_week' =>
                                $availability
                                    ->day_of_week,

                            'start_time' =>
                                $availability
                                    ->start_time,

                            'end_time' =>
                                $availability
                                    ->end_time,

                            'timezone' =>
                                $availability
                                    ->timezone,

                            'is_recurring' =>
                                (bool)
                                $availability
                                    ->is_recurring,
                        ]
                    )
                    ->values()
                    ->all();
        }

        return [
            'id' =>
                $this->id,

            'name' =>
                $this->name,

            'email' =>
                $this->email,

            /*
             * Field legacy.
             */
            'course' =>
                $this->course,

            'skills' =>
                $this->skills ?? [],

            /*
             * Data matching Buddy.
             */
            'learning_styles' =>
                $this->learning_styles ?? [],

            'subjects' =>
                $subjects,

            'availabilities' =>
                $availabilities,

            'last_active_at' =>
                $this->last_active_at
                    ?->toIso8601String(),

            /*
             * Bio top-level tetap ada
             * untuk kompatibilitas.
             */
            'bio' =>
                $profile?->bio ??
                $this->bio,

            'profile' => [
                'bio' =>
                    $profile?->bio ??
                    $this->bio,

                'avatar_url' =>
                    $avatarUrl,

                'phone_number' =>
                    $profile?->phone_number,

                'university' =>
                    $profile?->university,

                'major' =>
                    $profile?->major,

                'github_url' =>
                    $profile?->github_url,

                'linkedin_url' =>
                    $profile?->linkedin_url,
            ],

            'created_at' =>
                $this->created_at
                    ?->toIso8601String(),
        ];
    }
}