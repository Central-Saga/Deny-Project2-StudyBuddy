<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudyGroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
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
            'is_private' => $this->is_private,

            'creator' => UserResource::make(
                $this->whenLoaded('creator')
            ),

            'subject' => SubjectResource::make(
                $this->whenLoaded('subject')
            ),

            'members' => GroupMemberResource::collection(
                $this->whenLoaded('members')
            ),
        ];
    }
}