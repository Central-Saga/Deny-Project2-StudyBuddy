<?php

namespace App\Repositories\Eloquent;

use App\Models\GroupMember;
use App\Models\SessionParticipant;
use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GroupRepository implements GroupRepositoryInterface
{
    private const GROUP_RELATIONS = [
        'creator:id,name',
        'creator.profile:id,user_id,avatar_url',
        'subject:id,code,name',
        'members.user:id,name',
        'members.user.profile:id,user_id,avatar_url',
    ];

    private const SESSION_RELATIONS = [
        'host:id,name',
        'subject:id,name',
        'studyGroup:id,name,slug',
    ];

    public function listGroups(): Collection
    {
        return StudyGroup::query()
            ->with(self::GROUP_RELATIONS)
            ->latest()
            ->get();
    }

    public function loadGroupDetail(StudyGroup $group): StudyGroup
    {
        return $group->load(self::GROUP_RELATIONS);
    }

    public function slugExists(string $slug, ?int $ignoreGroupId = null): bool
    {
        return StudyGroup::withTrashed()
            ->when(
                $ignoreGroupId,
                fn ($query) => $query->where('id', '!=', $ignoreGroupId)
            )
            ->where('slug', $slug)
            ->exists();
    }

    public function createGroup(array $data): StudyGroup
    {
        return StudyGroup::create($data);
    }

    public function updateGroup(StudyGroup $group, array $data): void
    {
        $group->update($data);
    }

    public function softDeleteGroupWithSessions(StudyGroup $group): void
    {
        $group->sessions()->get()->each->delete();
        $group->delete();
    }

    public function createMember(StudyGroup $group, array $data): GroupMember
    {
        return $group->members()->create($data);
    }

    public function findMembership(StudyGroup $group, int $userId): ?GroupMember
    {
        return $group->members()->where('user_id', $userId)->first();
    }

    public function updateMember(GroupMember $member, array $data): void
    {
        $member->update($data);
    }

    public function countAcceptedMembers(StudyGroup $group): int
    {
        return $group->members()->where('status', 'accepted')->count();
    }

    public function loadMemberUser(GroupMember $member): GroupMember
    {
        return $member->load([
            'user:id,name',
            'user.profile:id,user_id,avatar_url',
        ]);
    }

    public function isAcceptedMember(StudyGroup $group, int $userId): bool
    {
        return $group->members()
            ->where('user_id', $userId)
            ->where('status', 'accepted')
            ->exists();
    }

    public function acceptedMemberUserIds(StudyGroup $group, int $exceptUserId): \Illuminate\Support\Collection
    {
        return $group->members()
            ->where('status', 'accepted')
            ->where('user_id', '!=', $exceptUserId)
            ->pluck('user_id');
    }

    public function insertNotification(
        string $type,
        int $userId,
        string $title,
        string $message,
        array $extra = []
    ): void {
        try {
            DB::table('notifications')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => $type,
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id' => $userId,
                'data' => json_encode(
                    array_merge([
                        'title' => $title,
                        'message' => $message,
                    ], $extra),
                    JSON_UNESCAPED_UNICODE
                ),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function adminListGroups(?string $search, ?string $privacy): Collection
    {
        return StudyGroup::query()
            ->with([
                'creator:id,name,email',
                'subject:id,code,name',
            ])
            ->withCount([
                'members as accepted_members_count' => fn ($query) => $query->where('status', 'accepted'),
                'members as pending_members_count' => fn ($query) => $query->where('status', 'pending'),
                'members as rejected_members_count' => fn ($query) => $query->where('status', 'rejected'),
                'members as group_admins_count' => fn ($query) => $query
                    ->where('role', 'admin')
                    ->where('status', 'accepted'),
                'sessions',
            ])
            ->when(
                ! empty($search),
                function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                $privacy !== null,
                fn ($query) => $query->where('is_private', $privacy === 'private')
            )
            ->latest()
            ->get();
    }

    public function adminLoadGroupDetail(StudyGroup $group): StudyGroup
    {
        return $group->load([
            'creator:id,name,email',
            'subject:id,code,name',

            'members' => function ($query) {
                $query
                    ->with('user:id,name,email')
                    ->orderBy('role')
                    ->orderBy('status')
                    ->orderBy('created_at');
            },

            'sessions' => function ($query) {
                $query
                    ->select([
                        'id',
                        'study_group_id',
                        'host_id',
                        'title',
                        'scheduled_at',
                        'created_at',
                    ])
                    ->latest('scheduled_at');
            },
        ]);
    }

    public function transaction(callable $callback): mixed
    {
        return DB::transaction($callback);
    }

    public function listSessionsForUser(int $userId): Collection
    {
        return StudySession::query()
            ->with(self::SESSION_RELATIONS)
            ->withCount([
                'participants as participants_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])
            ->withExists([
                'participants as is_joined' => function ($query) use ($userId) {
                    $query
                        ->where('user_id', $userId)
                        ->where('status', 'accepted');
                },
            ])
            ->whereHas(
                'studyGroup.members',
                function ($query) use ($userId) {
                    $query
                        ->where('user_id', $userId)
                        ->where('status', 'accepted');
                }
            )
            ->orderBy('scheduled_at', 'asc')
            ->get();
    }

    public function findGroupOrFail(int $id): StudyGroup
    {
        return StudyGroup::findOrFail($id);
    }

    public function createSession(array $data): StudySession
    {
        return StudySession::create($data);
    }

    public function createParticipant(StudySession $session, array $data): SessionParticipant
    {
        return $session->participants()->create($data);
    }

    public function loadSessionGroupMembers(StudySession $session): StudySession
    {
        return $session->load(['studyGroup.members']);
    }

    public function loadSessionDetail(StudySession $session): StudySession
    {
        $session->load([
            ...self::SESSION_RELATIONS,
            'participants.user:id,name',
        ]);

        $session->loadCount([
            'participants as participants_count' => function ($query) {
                $query->where('status', 'accepted');
            },
        ]);

        return $session;
    }

    public function isAcceptedParticipant(StudySession $session, int $userId): bool
    {
        return $session->participants()
            ->where('user_id', $userId)
            ->where('status', 'accepted')
            ->exists();
    }

    public function countAcceptedParticipants(StudySession $session): int
    {
        return $session->participants()->where('status', 'accepted')->count();
    }

    public function updateSession(StudySession $session, array $data): void
    {
        $session->update($data);
    }

    public function lockSessionWithGroup(int $sessionId): StudySession
    {
        return StudySession::query()
            ->with('studyGroup')
            ->lockForUpdate()
            ->findOrFail($sessionId);
    }

    public function findParticipant(StudySession $session, int $userId): ?SessionParticipant
    {
        return $session->participants()->where('user_id', $userId)->first();
    }

    public function updateParticipant(SessionParticipant $participant, array $data): void
    {
        $participant->update($data);
    }
}
