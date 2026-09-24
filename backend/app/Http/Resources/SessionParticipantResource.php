<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionParticipantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'study_session_id' => $this->study_session_id,
            'user_id' => $this->user_id,
            'role' => $this->role,
            'status' => $this->status,
            'joined_at' => $this->joined_at?->toIso8601String(),

            'user' => UserResource::make(
                $this->whenLoaded('user')
            ),
        ];
    }
}