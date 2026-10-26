<?php

namespace App\Repositories\Eloquent;

use App\Models\BuddyConnection;
use App\Models\StudyGroup;
use App\Models\User;
use App\Repositories\Contracts\BuddyRepositoryInterface;
use Closure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BuddyRepository implements BuddyRepositoryInterface
{
    public function loadMatchingProfile(User $user): void
    {
        $user->load([
            'userSubjects' => function ($query) {
                $query->where('type', 'learning');
            },
            'availabilities:id,user_id,day_of_week,start_time,end_time',
        ]);
    }

    public function searchBuddies(
        int $currentUserId,
        array $filters,
        Collection $requestedSubjectIds,
        bool $hasScheduleFilter
    ): Collection {
        $query = User::query()
            ->with([
                'profile:id,user_id,bio,avatar_url,university,major',
                'userSubjects' => function ($query) {
                    $query
                        ->where('type', 'learning')
                        ->with('subject:id,code,name');
                },
                'availabilities:id,user_id,day_of_week,start_time,end_time',
            ])
            ->where('id', '!=', $currentUserId)
            ->where('role', User::ROLE_USER)
            ->where('account_status', User::STATUS_ACTIVE);

        if (!empty($filters['search'])) {
            $search = strtolower(trim($filters['search']));

            $query->where(function ($query) use ($search) {
                $query
                    ->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw(
                        "LOWER(COALESCE(course, '')) LIKE ?",
                        ["%{$search}%"]
                    )
                    ->orWhereHas(
                        'profile',
                        function ($profileQuery) use ($search) {
                            $profileQuery->whereRaw(
                                "LOWER(COALESCE(bio, '')) LIKE ?",
                                ["%{$search}%"]
                            );
                        }
                    )
                    ->orWhereHas(
                        'userSubjects',
                        function ($userSubjectQuery) use ($search) {
                            $userSubjectQuery
                                ->where('type', 'learning')
                                ->whereHas(
                                    'subject',
                                    function ($subjectQuery) use ($search) {
                                        $subjectQuery
                                            ->whereRaw(
                                                'LOWER(name) LIKE ?',
                                                ["%{$search}%"]
                                            )
                                            ->orWhereRaw(
                                                'LOWER(code) LIKE ?',
                                                ["%{$search}%"]
                                            );
                                    }
                                );
                        }
                    );
            });
        }

        // Legacy course filter tetap dipertahankan untuk frontend lama.
        if (
            !empty($filters['course']) &&
            $filters['course'] !== 'Semua'
        ) {
            $query->where('course', $filters['course']);
        }

        /*
         * Subject hanya menjadi filter wajib jika user memang memilih
         * filter mata kuliah secara manual. Saat mode otomatis, seluruh
         * buddy tetap ditampilkan lalu diberi score berdasarkan profil.
         */
        if ($requestedSubjectIds->isNotEmpty()) {
            $query->whereHas(
                'userSubjects',
                function ($query) use ($requestedSubjectIds) {
                    $query
                        ->where('type', 'learning')
                        ->whereIn('subject_id', $requestedSubjectIds->all());
                }
            );
        }

        // Filter jadwal manual tetap mempersempit hasil berdasarkan overlap.
        if ($hasScheduleFilter) {
            $dayOfWeek = (int) $filters['day_of_week'];
            $startTime = $filters['start_time'];
            $endTime = $filters['end_time'];

            $query->whereHas(
                'availabilities',
                function ($query) use ($dayOfWeek, $startTime, $endTime) {
                    $query
                        ->where('day_of_week', $dayOfWeek)
                        ->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                }
            );
        }

        return $query->get();
    }

    public function activeConnectionsFor(
        int $userId,
        bool $withUsers = false
    ): Collection {
        $query = BuddyConnection::query();

        if ($withUsers) {
            $query->with(['requester.profile', 'receiver.profile']);
        }

        return $query
            ->where(function ($query) use ($userId) {
                $query
                    ->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->whereIn('status', ['pending', 'accepted'])
            ->latest()
            ->get();
    }

    public function findBuddyDetail(int $id): User
    {
        return User::query()
            ->with([
                'profile:id,user_id,bio,avatar_url,phone_number,university,major,github_url,linkedin_url',
                'userSubjects' => function ($query) {
                    $query
                        ->where('type', 'learning')
                        ->with('subject:id,code,name');
                },
                'availabilities:id,user_id,day_of_week,start_time,end_time,timezone,is_recurring',
            ])
            ->findOrFail($id);
    }

    public function findUserOrFail(int $id): User
    {
        return User::findOrFail($id);
    }

    public function findConnection(
        int $firstUserId,
        int $secondUserId,
        bool $lockForUpdate = false,
        bool $withTrashed = false
    ): ?BuddyConnection {
        $query = BuddyConnection::query()
            ->where(function ($query) use ($firstUserId, $secondUserId) {
                $query
                    ->where(function ($query) use ($firstUserId, $secondUserId) {
                        $query
                            ->where('requester_id', $firstUserId)
                            ->where('receiver_id', $secondUserId);
                    })
                    ->orWhere(function ($query) use ($firstUserId, $secondUserId) {
                        $query
                            ->where('requester_id', $secondUserId)
                            ->where('receiver_id', $firstUserId);
                    });
            });

        if ($withTrashed) {
            $query->withTrashed();
        }

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    public function transaction(Closure $callback): mixed
    {
        return DB::transaction($callback);
    }

    public function lockUsers(array $userIds): void
    {
        User::query()
            ->whereIn('id', $userIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    public function restoreConnection(
        BuddyConnection $connection,
        int $requesterId,
        int $receiverId
    ): BuddyConnection {
        $connection->restore();

        return $this->resetConnectionToPending(
            $connection,
            $requesterId,
            $receiverId
        );
    }

    public function resetConnectionToPending(
        BuddyConnection $connection,
        int $requesterId,
        int $receiverId
    ): BuddyConnection {
        $connection->update([
            'requester_id' => $requesterId,
            'receiver_id' => $receiverId,
            'status' => 'pending',
        ]);

        return $connection->fresh();
    }

    public function createPendingConnection(
        int $requesterId,
        int $receiverId
    ): BuddyConnection {
        return BuddyConnection::create([
            'requester_id' => $requesterId,
            'receiver_id' => $receiverId,
            'status' => 'pending',
        ]);
    }

    public function updateConnectionStatus(
        BuddyConnection $connection,
        string $status
    ): void {
        $connection->update(['status' => $status]);
    }

    public function deleteConnection(BuddyConnection $connection): void
    {
        $connection->delete();
    }

    public function loadConnectionUsers(
        BuddyConnection $connection
    ): BuddyConnection {
        return $connection->load(['requester.profile', 'receiver.profile']);
    }

    public function groupsCreatedBy(int $userId): Collection
    {
        return StudyGroup::query()
            ->with(['subject:id,code,name'])
            ->withCount([
                'members as members_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])
            ->where('creator_id', $userId)
            ->latest()
            ->get();
    }

    public function membershipsFor(
        Collection $groupIds,
        int $userId
    ): Collection {
        return $groupIds->isEmpty()
            ? collect()
            : DB::table('group_members')
                ->whereIn('study_group_id', $groupIds)
                ->where('user_id', $userId)
                ->get()
                ->keyBy('study_group_id');
    }
}
