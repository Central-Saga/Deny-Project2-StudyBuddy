<?php

namespace App\Services;

use App\Exceptions\BuddyException;
use App\Http\Resources\BuddyUserResource;
use App\Models\BuddyConnection;
use App\Models\User;
use App\Repositories\Contracts\BuddyRepositoryInterface;
use App\Services\Buddy\BuddyPresenter;
use App\Services\Buddy\BuddyScorer;
use Illuminate\Pagination\LengthAwarePaginator;

class BuddyService
{
    private const PER_PAGE = 12;

    public function __construct(
        private readonly BuddyRepositoryInterface $buddies,
        private readonly BuddyScorer $scorer,
        private readonly BuddyPresenter $presenter
    ) {
    }

    public function index(
        User $currentUser,
        array $validated,
        int $page,
        string $path,
        array $query
    ): array {
        $this->buddies->loadMatchingProfile($currentUser);

        $criteria = $this->scorer->buildCriteria($currentUser, $validated);

        $buddies = $this->buddies->searchBuddies(
            $currentUser->id,
            $validated,
            $criteria['requested_subject_ids'],
            $criteria['has_schedule_filter']
        );

        $connectionByBuddyId = [];

        foreach ($this->buddies->activeConnectionsFor($currentUser->id) as $connection) {
            $buddyId =
                (int) $connection->requester_id === (int) $currentUser->id
                    ? (int) $connection->receiver_id
                    : (int) $connection->requester_id;

            if (!array_key_exists($buddyId, $connectionByBuddyId)) {
                $connectionByBuddyId[$buddyId] = $connection;
            }
        }

        $buddies->each(function ($buddy) use (
            $criteria,
            $connectionByBuddyId,
            $currentUser
        ) {
            $this->scorer->score($buddy, $criteria);

            $this->presenter->attachConnectionState(
                $buddy,
                $connectionByBuddyId[$buddy->id] ?? null,
                $currentUser->id
            );
        });

        $buddies = $this->scorer->sort($buddies, $criteria['has_criteria']);

        $paginated = new LengthAwarePaginator(
            $buddies->forPage($page, self::PER_PAGE)->values(),
            $buddies->count(),
            self::PER_PAGE,
            $page,
            ['path' => $path, 'query' => $query]
        );

        $response = BuddyUserResource::collection($paginated)
            ->response()
            ->getData(true);

        $response['matching'] = [
            'mode' => $criteria['has_explicit_filter']
                ? 'filters'
                : ($criteria['has_profile_criteria'] ? 'profile' : 'none'),
            'has_criteria' => $criteria['has_criteria'],
        ];

        return $response;
    }

    /**
     * @return array{buddy: User, related_groups: \Illuminate\Support\Collection}
     */
    public function show(User $currentUser, int $id): array
    {
        $buddy = $this->buddies->findBuddyDetail($id);

        if ((int) $buddy->id === (int) $currentUser->id) {
            throw new BuddyException(
                'Profil ini adalah profil Anda sendiri.',
                422
            );
        }

        $this->presenter->attachConnectionState(
            $buddy,
            $this->buddies->findConnection($currentUser->id, $buddy->id),
            $currentUser->id
        );

        $groups = $this->buddies->groupsCreatedBy($buddy->id);
        $memberships = $this->buddies->membershipsFor(
            $groups->pluck('id'),
            $currentUser->id
        );

        return [
            'buddy' => $buddy,
            'related_groups' => $this->presenter->relatedGroups(
                $groups,
                $memberships
            ),
        ];
    }

    public function connections(User $currentUser)
    {
        return $this->buddies->activeConnectionsFor($currentUser->id, true);
    }

    public function connect(User $currentUser, int $id): BuddyConnection
    {
        $buddy = $this->buddies->findUserOrFail($id);

        if ((int) $currentUser->id === (int) $buddy->id) {
            throw new BuddyException(
                'Tidak dapat melakukan connect ke diri sendiri.',
                422
            );
        }

        $result = $this->buddies->transaction(function () use ($currentUser, $buddy) {
            $this->buddies->lockUsers([$currentUser->id, $buddy->id]);

            $existing = $this->buddies->findConnection(
                $currentUser->id,
                $buddy->id,
                true,
                true
            );

            if ($existing?->trashed()) {
                return [
                    'connection' => $this->buddies->restoreConnection(
                        $existing,
                        $currentUser->id,
                        $buddy->id
                    ),
                ];
            }

            if (
                $existing &&
                in_array($existing->status, ['pending', 'accepted'], true)
            ) {
                return ['existing' => $existing];
            }

            if ($existing && $existing->status === 'rejected') {
                return [
                    'connection' => $this->buddies->resetConnectionToPending(
                        $existing,
                        $currentUser->id,
                        $buddy->id
                    ),
                ];
            }

            return [
                'connection' => $this->buddies->createPendingConnection(
                    $currentUser->id,
                    $buddy->id
                ),
            ];
        });

        if (isset($result['existing'])) {
            throw new BuddyException(
                'Hubungan atau permintaan koneksi masih aktif.',
                409,
                [
                    'status' => $result['existing']->status,
                    'connection_id' => $result['existing']->id,
                ]
            );
        }

        return $this->buddies->loadConnectionUsers($result['connection']);
    }

    public function accept(
        User $currentUser,
        BuddyConnection $connection
    ): BuddyConnection {
        $this->assertPendingForReceiver(
            $currentUser,
            $connection,
            'Anda tidak memiliki akses untuk menerima permintaan ini.'
        );

        $this->buddies->updateConnectionStatus($connection, 'accepted');

        return $this->buddies->loadConnectionUsers($connection);
    }

    public function reject(User $currentUser, BuddyConnection $connection): void
    {
        $this->assertPendingForReceiver(
            $currentUser,
            $connection,
            'Anda tidak memiliki akses untuk menolak permintaan ini.'
        );

        $this->buddies->updateConnectionStatus($connection, 'rejected');
    }

    /**
     * @return string pesan sukses
     */
    public function destroy(User $currentUser, BuddyConnection $connection): string
    {
        $currentUserId = (int) $currentUser->id;

        $isRequester = (int) $connection->requester_id === $currentUserId;
        $isReceiver = (int) $connection->receiver_id === $currentUserId;

        if (!$isRequester && !$isReceiver) {
            throw new BuddyException(
                'Anda tidak memiliki akses ke koneksi ini.',
                403
            );
        }

        if ($connection->status === 'pending' && !$isRequester) {
            throw new BuddyException(
                'Receiver harus menolak request melalui aksi Tolak.',
                403
            );
        }

        $wasAccepted = $connection->status === 'accepted';

        $this->buddies->deleteConnection($connection);

        return $wasAccepted
            ? 'Koneksi buddy berhasil diputus.'
            : 'Permintaan buddy berhasil dibatalkan.';
    }

    private function assertPendingForReceiver(
        User $currentUser,
        BuddyConnection $connection,
        string $forbiddenMessage
    ): void {
        if ((int) $connection->receiver_id !== (int) $currentUser->id) {
            throw new BuddyException($forbiddenMessage, 403);
        }

        if ($connection->status !== 'pending') {
            throw new BuddyException(
                'Permintaan ini sudah tidak berstatus pending.',
                422
            );
        }
    }
}
