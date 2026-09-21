<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'profile' => [
                'bio' => $this->profile?->bio,
                'avatar_url' => $this->profile?->avatar_url,
                'university' => $this->profile?->university,
                'major' => $this->profile?->major,
                'phone_number' => $this->profile?->phone_number,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}