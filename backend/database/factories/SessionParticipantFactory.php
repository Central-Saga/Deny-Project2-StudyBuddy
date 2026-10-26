<?php

namespace Database\Factories;

use App\Models\SessionParticipant;
use App\Models\StudySession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SessionParticipant>
 */
class SessionParticipantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'study_session_id' => StudySession::factory(),
            'user_id' => User::factory(),
            'role' => 'participant',
            'status' => 'accepted',
            'joined_at' => now(),
        ];
    }

    public function host(): static
    {
        return $this->state(fn () => ['role' => 'host']);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'joined_at' => null,
        ]);
    }

    public function left(): static
    {
        return $this->state(fn () => ['status' => 'left']);
    }
}
