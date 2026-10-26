<?php

namespace App\Services\Buddy;

use App\Models\BuddyConnection;
use App\Models\User;
use Illuminate\Support\Collection;

class BuddyPresenter
{
    public function attachConnectionState(
        User $buddy,
        ?BuddyConnection $connection,
        int $currentUserId
    ): void {
        $buddy->setAttribute('connection_id', $connection?->id);
        $buddy->setAttribute('connection_status', $connection?->status);
        $buddy->setAttribute(
            'connection_direction',
            !$connection
                ? null
                : (
                    (int) $connection->requester_id === (int) $currentUserId
                        ? 'outgoing'
                        : 'incoming'
                )
        );
        $buddy->setAttribute(
            'is_connected',
            $connection?->status === 'accepted'
        );
    }

    public function relatedGroups(
        Collection $groups,
        Collection $memberships
    ): Collection {
        return $groups
            ->map(function ($group) use ($memberships) {
                $membership = $memberships->get($group->id);

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'max_members' => $group->max_members,
                    'members_count' => (int) $group->members_count,
                    'is_private' => (bool) $group->is_private,
                    'is_full' =>
                        (int) $group->members_count >=
                        (int) $group->max_members,
                    'membership_status' => $membership->status ?? null,
                    'subject' => $group->subject
                        ? [
                            'id' => $group->subject->id,
                            'code' => $group->subject->code,
                            'name' => $group->subject->name,
                        ]
                        : null,
                ];
            })
            ->values();
    }
}
