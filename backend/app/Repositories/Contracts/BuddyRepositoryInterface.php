<?php

namespace App\Repositories\Contracts;

use App\Models\BuddyConnection;
use App\Models\User;
use Closure;
use Illuminate\Support\Collection;

interface BuddyRepositoryInterface
{
    public function loadMatchingProfile(User $user): void;

    public function searchBuddies(
        int $currentUserId,
        array $filters,
        Collection $requestedSubjectIds,
        bool $hasScheduleFilter
    ): Collection;

    public function activeConnectionsFor(
        int $userId,
        bool $withUsers = false
    ): Collection;

    public function findBuddyDetail(int $id): User;

    public function findUserOrFail(int $id): User;

    public function findConnection(
        int $firstUserId,
        int $secondUserId,
        bool $lockForUpdate = false,
        bool $withTrashed = false
    ): ?BuddyConnection;

    public function transaction(Closure $callback): mixed;

    public function lockUsers(array $userIds): void;

    public function restoreConnection(
        BuddyConnection $connection,
        int $requesterId,
        int $receiverId
    ): BuddyConnection;

    public function resetConnectionToPending(
        BuddyConnection $connection,
        int $requesterId,
        int $receiverId
    ): BuddyConnection;

    public function createPendingConnection(
        int $requesterId,
        int $receiverId
    ): BuddyConnection;

    public function updateConnectionStatus(
        BuddyConnection $connection,
        string $status
    ): void;

    public function deleteConnection(BuddyConnection $connection): void;

    public function loadConnectionUsers(
        BuddyConnection $connection
    ): BuddyConnection;

    public function groupsCreatedBy(int $userId): Collection;

    public function membershipsFor(
        Collection $groupIds,
        int $userId
    ): Collection;
}
