<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\GroupMember;
use App\Models\StudyGroup;
use App\Models\User;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class GroupService
{
    public function __construct(
        private readonly GroupRepositoryInterface $groups
    ) {}

    public function list(): Collection
    {
        return $this->groups->listGroups();
    }

    public function detail(StudyGroup $group): StudyGroup
    {
        return $this->groups->loadGroupDetail($group);
    }

    public function create(array $validated, User $user): StudyGroup
    {
        $slug = $this->generateUniqueSlug($validated['name']);

        try {
            $group = $this->groups->transaction(function () use ($validated, $user, $slug) {
                $group = $this->groups->createGroup([
                    'creator_id' => $user->id,
                    'subject_id' => $validated['subject_id'],
                    'name' => $validated['name'],
                    'slug' => $slug,
                    'description' => $validated['description'] ?? null,
                    'max_members' => $validated['max_members'],
                    'is_private' => $validated['is_private'] ?? false,
                ]);

                // Creator otomatis menjadi admin.
                $this->groups->createMember($group, [
                    'user_id' => $user->id,
                    'role' => 'admin',
                    'status' => 'accepted',
                    'joined_at' => now(),
                ]);

                return $group;
            });
        } catch (\Throwable $e) {
            report($e);

            throw new DomainException('Gagal membuat grup.', 500);
        }

        return $this->groups->loadGroupDetail($group);
    }

    public function update(StudyGroup $group, array $validated): StudyGroup
    {
        // Kapasitas tidak boleh lebih kecil dari jumlah anggota aktif.
        if (array_key_exists('max_members', $validated)) {
            $activeMembers = $this->groups->countAcceptedMembers($group);

            if ($validated['max_members'] < $activeMembers) {
                throw new DomainException(
                    "Kapasitas minimal saat ini adalah {$activeMembers} anggota.",
                    422
                );
            }
        }

        // Jika nama berubah, slug juga diperbarui.
        if (
            array_key_exists('name', $validated) &&
            $validated['name'] !== $group->name
        ) {
            $validated['slug'] = $this->generateUniqueSlug(
                $validated['name'],
                $group->id
            );
        }

        $this->groups->updateGroup($group, $validated);

        return $this->groups->loadGroupDetail($group);
    }

    public function delete(StudyGroup $group): void
    {
        try {
            $this->groups->transaction(
                fn () => $this->groups->softDeleteGroupWithSessions($group)
            );
        } catch (\Throwable $e) {
            report($e);

            throw new DomainException('Gagal menghapus grup.', 500);
        }
    }

    /**
     * Join / keluar / batalkan permintaan.
     *
     * @return array{message: string, joined: bool, status: string}
     */
    public function toggleMembership(StudyGroup $group, User $user): array
    {
        $userId = $user->id;
        $membership = $this->groups->findMembership($group, $userId);

        if ($membership && $membership->status === 'accepted') {
            // Creator tidak boleh keluar dari grupnya sendiri.
            if ((int) $group->creator_id === (int) $userId) {
                throw new DomainException(
                    'Creator grup tidak dapat keluar dari grup. Transfer pengelolaan grup terlebih dahulu.',
                    422
                );
            }

            $this->groups->updateMember($membership, [
                'status' => 'rejected',
                'joined_at' => null,
            ]);

            return [
                'message' => 'Berhasil keluar dari grup.',
                'joined' => false,
                'status' => 'rejected',
            ];
        }

        if ($membership && $membership->status === 'pending') {
            $this->groups->updateMember($membership, [
                'status' => 'rejected',
                'joined_at' => null,
            ]);

            return [
                'message' => 'Permintaan bergabung berhasil dibatalkan.',
                'joined' => false,
                'status' => 'rejected',
            ];
        }

        $activeMembers = $this->groups->countAcceptedMembers($group);

        if ($activeMembers >= $group->max_members) {
            throw new DomainException('Grup sudah penuh.', 422);
        }

        // Grup private: pending. Grup public: langsung accepted.
        $newStatus = $group->is_private ? 'pending' : 'accepted';
        $joinedAt = $newStatus === 'accepted' ? now() : null;

        if ($membership) {
            // Pernah keluar / ditolak dan mencoba join lagi.
            $this->groups->updateMember($membership, [
                'role' => 'member',
                'status' => $newStatus,
                'joined_at' => $joinedAt,
            ]);

            $membership->refresh();
        } else {
            $membership = $this->groups->createMember($group, [
                'user_id' => $userId,
                'role' => 'member',
                'status' => $newStatus,
                'joined_at' => $joinedAt,
            ]);
        }

        if ($newStatus === 'pending') {
            $requesterName = $user->name;

            $this->groups->insertNotification(
                'group',
                (int) $group->creator_id,
                'Permintaan bergabung baru',
                "{$requesterName} ingin bergabung ke grup {$group->name}.",
                [
                    'group_id' => (int) $group->id,
                    'group_name' => $group->name,
                    'member_id' => (int) $membership->id,
                    'requester_id' => (int) $userId,
                    'requester_name' => $requesterName,
                    'status' => 'pending',
                ]
            );
        }

        return [
            'message' => $group->is_private
                ? 'Permintaan bergabung berhasil dikirim.'
                : 'Berhasil bergabung ke grup.',
            'joined' => $newStatus === 'accepted',
            'status' => $newStatus,
        ];
    }

    /**
     * Pastikan member milik grup yang diproses.
     */
    public function assertMemberBelongsToGroup(StudyGroup $group, GroupMember $member): void
    {
        if ((int) $member->study_group_id !== (int) $group->id) {
            throw new DomainException(
                'Data anggota tidak ditemukan pada grup ini.',
                404
            );
        }
    }

    /**
     * Approve / reject anggota (otorisasi dilakukan di controller).
     */
    public function updateMemberStatus(
        StudyGroup $group,
        GroupMember $member,
        string $status
    ): GroupMember {
        if ($member->status !== 'pending') {
            throw new DomainException(
                'Permintaan anggota ini sudah diproses.',
                422
            );
        }

        if (
            $status === 'accepted' &&
            $this->groups->countAcceptedMembers($group) >= $group->max_members
        ) {
            throw new DomainException(
                'Grup sudah penuh. Permintaan tidak dapat diterima.',
                422
            );
        }

        $this->groups->updateMember($member, [
            'status' => $status,
            'joined_at' => $status === 'accepted' ? now() : null,
        ]);

        $this->groups->insertNotification(
            'group',
            (int) $member->user_id,
            $status === 'accepted'
                ? 'Permintaan bergabung diterima'
                : 'Permintaan bergabung ditolak',
            $status === 'accepted'
                ? "Permintaan bergabung ke grup {$group->name} telah diterima."
                : "Permintaan bergabung ke grup {$group->name} telah ditolak.",
            [
                'group_id' => (int) $group->id,
                'group_name' => $group->name,
                'status' => $status,
            ]
        );

        return $this->groups->loadMemberUser($member);
    }

    private function generateUniqueSlug(string $name, ?int $ignoreGroupId = null): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'study-group';
        }

        $slug = $baseSlug;
        $counter = 1;

        while ($this->groups->slugExists($slug, $ignoreGroupId)) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
