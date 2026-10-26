<?php

namespace Database\Factories;

use App\Models\GroupMember;
use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GroupMember>
 */
class GroupMemberFactory extends Factory
{
    public function definition(): array
    {
        return [
            'study_group_id' => StudyGroup::factory(),
            'user_id' => User::factory(),
            'role' => 'member',
            'status' => 'accepted',
            'joined_at' => now(),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'joined_at' => null,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
            'joined_at' => null,
        ]);
    }
}
