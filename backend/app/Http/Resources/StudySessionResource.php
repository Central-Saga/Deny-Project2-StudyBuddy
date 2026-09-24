<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudySessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'host_id' => $this->host_id,
            'study_group_id' => $this->study_group_id,
            'subject_id' => $this->subject_id,
            'title' => $this->title,
            'description' => $this->description,
            'meeting_link' => $this->meeting_link,
            'max_participants' => $this->max_participants,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'status' => $this->status,
            'participants_count' => $this->participants_count,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'host' => UserResource::make(
                $this->whenLoaded('host')
            ),

            'study_group' => StudyGroupResource::make(
                $this->whenLoaded('studyGroup')
            ),

            'subject' => SubjectResource::make(
                $this->whenLoaded('subject')
            ),
            'participants' => SessionParticipantResource::collection(
                $this->whenLoaded('participants')
            ),
        ];
    }
}