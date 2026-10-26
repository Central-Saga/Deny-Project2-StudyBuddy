<?php

namespace App\Services;

use App\Models\StudyGroup;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Support\Collection;

class AdminGroupService
{
    public function __construct(
        private readonly GroupRepositoryInterface $groups
    ) {}

    public function list(?string $search, ?string $privacy): Collection
    {
        return $this->groups
            ->adminListGroups($search, $privacy)
            ->map(fn (StudyGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'slug' => $group->slug,
                'description' => $group->description,
                'max_members' => $group->max_members,
                'is_private' => (bool) $group->is_private,
                'privacy' => $group->is_private ? 'private' : 'public',
                'creator' => $this->creator($group),
                'subject' => $this->subject($group),
                'member_stats' => [
                    'accepted' => (int) $group->accepted_members_count,
                    'pending' => (int) $group->pending_members_count,
                    'rejected' => (int) $group->rejected_members_count,
                    'group_admins' => (int) $group->group_admins_count,
                ],
                'sessions_count' => (int) $group->sessions_count,
                'created_at' => $group->created_at?->toIso8601String(),
                'updated_at' => $group->updated_at?->toIso8601String(),
            ])
            ->values();
    }

    public function detail(StudyGroup $group): array
    {
        $group = $this->groups->adminLoadGroupDetail($group);

        $members = $group->members
            ->map(fn ($member) => [
                'id' => $member->id,
                'user' => $member->user
                    ? [
                        'id' => $member->user->id,
                        'name' => $member->user->name,
                        'email' => $member->user->email,
                    ]
                    : null,
                // Role di dalam group, bukan role admin sistem.
                'role' => $member->role,
                'status' => $member->status,
                'joined_at' => $member->joined_at?->toIso8601String(),
            ])
            ->values();

        $sessions = $group->sessions
            ->map(fn ($session) => [
                'id' => $session->id,
                'host_id' => $session->host_id,
                'title' => $session->title,
                'scheduled_at' => $session->scheduled_at,
                'created_at' => $session->created_at?->toIso8601String(),
            ])
            ->values();

        return [
            'id' => $group->id,
            'name' => $group->name,
            'slug' => $group->slug,
            'description' => $group->description,
            'max_members' => $group->max_members,
            'is_private' => (bool) $group->is_private,
            'privacy' => $group->is_private ? 'private' : 'public',
            'creator' => $this->creator($group),
            'subject' => $this->subject($group),
            'member_stats' => [
                'accepted' => $group->members->where('status', 'accepted')->count(),
                'pending' => $group->members->where('status', 'pending')->count(),
                'rejected' => $group->members->where('status', 'rejected')->count(),
                'group_admins' => $group->members
                    ->where('status', 'accepted')
                    ->where('role', 'admin')
                    ->count(),
            ],
            'members' => $members,
            'sessions' => $sessions,
            'created_at' => $group->created_at?->toIso8601String(),
            'updated_at' => $group->updated_at?->toIso8601String(),
        ];
    }

    private function creator(StudyGroup $group): ?array
    {
        return $group->creator
            ? [
                'id' => $group->creator->id,
                'name' => $group->creator->name,
                'email' => $group->creator->email,
            ]
            : null;
    }

    private function subject(StudyGroup $group): ?array
    {
        return $group->subject
            ? [
                'id' => $group->subject->id,
                'code' => $group->subject->code,
                'name' => $group->subject->name,
            ]
            : null;
    }
}
