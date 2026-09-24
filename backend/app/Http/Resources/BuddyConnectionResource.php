<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuddyConnectionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requester_id' => $this->requester_id,
            'receiver_id' => $this->receiver_id,
            'status' => $this->status,

            'requester' => UserResource::make(
                $this->whenLoaded('requester')
            ),

            'receiver' => UserResource::make(
                $this->whenLoaded('receiver')
            ),
        ];
    }
}