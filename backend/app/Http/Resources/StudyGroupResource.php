<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudyGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'creator_id' => $this->creator_id,
            'subject_id' => $this->subject_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'max_members' => $this->max_members,
            'is_private' => (bool) $this->is_private,

            'creator' => $this->relationLoaded('creator')
                ? [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                ]
                : null,

            'subject' => $this->relationLoaded('subject')
                ? [
                    'id' => $this->subject->id,
                    'code' => $this->subject->code,
                    'name' => $this->subject->name,
                ]
                : null,

            'members' => GroupMemberResource::collection(
                $this->whenLoaded('members')
            ),

            'created_at' => $this->created_at
                ?->toIso8601String(),

            'updated_at' => $this->updated_at
                ?->toIso8601String(),
        ];
    }
}