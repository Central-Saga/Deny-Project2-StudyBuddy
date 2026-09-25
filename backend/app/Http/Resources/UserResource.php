<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatar = $this->profile?->avatar_url;

        $avatarUrl = null;

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

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            /*
             * Field lama tetap dikirim untuk kompatibilitas
             * modul frontend yang sudah ada.
             */
            'course' => $this->course,
            'skills' => $this->skills ?? [],

            /*
             * Bio top-level dipertahankan sementara.
             * Prioritas sumbernya adalah profiles.bio.
             */
            'bio' => $this->profile?->bio ?? $this->bio,

            'profile' => [
                'bio' => $this->profile?->bio ?? $this->bio,
                'avatar_url' => $avatarUrl,
                'phone_number' => $this->profile?->phone_number,
                'university' => $this->profile?->university,
                'major' => $this->profile?->major,
                'github_url' => $this->profile?->github_url,
                'linkedin_url' => $this->profile?->linkedin_url,
            ],

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}