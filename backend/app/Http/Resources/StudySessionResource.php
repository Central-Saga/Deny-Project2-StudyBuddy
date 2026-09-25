<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudySessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isJoined = (bool) ($this->is_joined ?? false);

        $isHost =
            (int) $this->host_id ===
            (int) ($request->user()?->id ?? 0);

        return [
            'id' => $this->id,
            'host_id' => $this->host_id,
            'study_group_id' => $this->study_group_id,
            'subject_id' => $this->subject_id,
            'title' => $this->title,
            'description' => $this->description,

            'meeting_link' =>
                ($isJoined || $isHost)
                    ? $this->meeting_link
                    : null,

            'max_participants' => $this->max_participants,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'status' => $this->status,
            'participants_count' => $this->participants_count,
            'is_joined' => $isJoined || $isHost,
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
