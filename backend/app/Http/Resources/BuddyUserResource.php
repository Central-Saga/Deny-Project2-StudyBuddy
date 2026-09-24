<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuddyUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'course' => $this->course,
            'skills' => $this->skills,
            'bio' => $this->bio,
            'is_connected' => (bool) ($this->is_connected ?? false),
        ];
    }
}