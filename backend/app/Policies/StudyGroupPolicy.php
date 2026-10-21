<?php

namespace App\Policies;

use App\Models\StudyGroup;
use App\Models\User;

class StudyGroupPolicy
{
    /**
     * User yang sudah login boleh membuat grup.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Creator atau admin aktif boleh mengubah grup.
     */
    public function update(User $user, StudyGroup $group): bool
    {
        return $this->isGroupAdmin($user, $group);
    }

    /**
     * Creator atau admin aktif boleh menghapus grup.
     */
    public function delete(User $user, StudyGroup $group): bool
    {
        return $this->isGroupAdmin($user, $group);
    }

    /**
     * Creator atau admin aktif boleh mengelola anggota.
     */
    public function manageMembers(User $user, StudyGroup $group): bool
    {
        return $this->isGroupAdmin($user, $group);
    }

    /**
     * Pemeriksaan role dalam grup.
     */
    private function isGroupAdmin(User $user, StudyGroup $group): bool
    {
        if ((int) $group->creator_id === (int) $user->id) {
            return true;
        }

        return $group->members()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->where('status', 'accepted')
            ->exists();
    }
}
