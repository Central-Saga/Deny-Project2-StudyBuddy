<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class GroupMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatar = $this->user?->profile?->avatar_url;

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
            'study_group_id' => $this->study_group_id,
            'user_id' => $this->user_id,
            'role' => $this->role,
            'status' => $this->status,

            'joined_at' => $this->joined_at
                ?->toIso8601String(),

            'user' => $this->relationLoaded('user') && $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,

                    'profile' => [
                        'avatar_url' => $avatarUrl,
                    ],
                ]
                : null,
        ];
    }
}