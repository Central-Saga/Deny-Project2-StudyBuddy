<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuddyConnectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;

        $direction = null;
        $otherUser = null;

        if ($currentUserId !== null) {
            if (
                (int) $this->requester_id ===
                (int) $currentUserId
            ) {
                $direction = 'outgoing';

                if (
                    $this->resource->relationLoaded(
                        'receiver'
                    )
                ) {
                    $otherUser = $this->receiver;
                }
            } elseif (
                (int) $this->receiver_id ===
                (int) $currentUserId
            ) {
                $direction = 'incoming';

                if (
                    $this->resource->relationLoaded(
                        'requester'
                    )
                ) {
                    $otherUser = $this->requester;
                }
            }
        }

        return [
            'id' => $this->id,
            'requester_id' => $this->requester_id,
            'receiver_id' => $this->receiver_id,
            'status' => $this->status,
            'direction' => $direction,

            'requester' => UserResource::make(
                $this->whenLoaded('requester')
            ),

            'receiver' => UserResource::make(
                $this->whenLoaded('receiver')
            ),

            'other_user' => UserResource::make(
                $otherUser
            ),

            'created_at' =>
                $this->created_at?->toIso8601String(),

            'updated_at' =>
                $this->updated_at?->toIso8601String(),
        ];
    }
}
