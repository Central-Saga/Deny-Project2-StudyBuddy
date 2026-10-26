<?php

namespace App\Repositories\Contracts;

use App\Models\GroupMember;
use App\Models\SessionParticipant;
use App\Models\StudyGroup;
use App\Models\StudySession;
use Illuminate\Database\Eloquent\Collection;

interface GroupRepositoryInterface
{
    public function listGroups(): Collection;

    public function loadGroupDetail(StudyGroup $group): StudyGroup;

    public function slugExists(string $slug, ?int $ignoreGroupId = null): bool;

    public function createGroup(array $data): StudyGroup;

    public function updateGroup(StudyGroup $group, array $data): void;

    public function softDeleteGroupWithSessions(StudyGroup $group): void;

    public function createMember(StudyGroup $group, array $data): GroupMember;

    public function findMembership(StudyGroup $group, int $userId): ?GroupMember;

    public function updateMember(GroupMember $member, array $data): void;

    public function countAcceptedMembers(StudyGroup $group): int;

    public function loadMemberUser(GroupMember $member): GroupMember;

    public function isAcceptedMember(StudyGroup $group, int $userId): bool;

    public function acceptedMemberUserIds(StudyGroup $group, int $exceptUserId): \Illuminate\Support\Collection;

    public function insertNotification(
        string $type,
        int $userId,
        string $title,
        string $message,
        array $extra = []
    ): void;

    public function adminListGroups(?string $search, ?string $privacy): Collection;

    public function adminLoadGroupDetail(StudyGroup $group): StudyGroup;

    public function transaction(callable $callback): mixed;

    // Sessions

    public function listSessionsForUser(int $userId): Collection;

    public function findGroupOrFail(int $id): StudyGroup;

    public function createSession(array $data): StudySession;

    public function createParticipant(StudySession $session, array $data): SessionParticipant;

    public function loadSessionGroupMembers(StudySession $session): StudySession;

    public function loadSessionDetail(StudySession $session): StudySession;

    public function isAcceptedParticipant(StudySession $session, int $userId): bool;

    public function countAcceptedParticipants(StudySession $session): int;

    public function updateSession(StudySession $session, array $data): void;

    public function lockSessionWithGroup(int $sessionId): StudySession;

    public function findParticipant(StudySession $session, int $userId): ?SessionParticipant;

    public function updateParticipant(SessionParticipant $participant, array $data): void;
}
