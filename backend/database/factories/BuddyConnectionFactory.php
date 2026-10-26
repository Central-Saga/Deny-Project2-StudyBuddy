<?php

namespace Database\Factories;

use App\Models\BuddyConnection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BuddyConnection>
 */
class BuddyConnectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'requester_id' => User::factory(),
            'receiver_id' => User::factory(),
            'status' => 'pending',
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => 'accepted']);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }
}
