<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\TutoringRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutoringRequest>
 */
class TutoringRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => User::factory(),
            'tutor_profile_id' => TutorProfile::factory(),
            'subject_id' => Subject::factory(),
            'topic' => fake()->sentence(3),
            'notes' => fake()->sentence(),
            'scheduled_at' => now()->addDays(3),
            'duration_minutes' => 60,
            'status' => 'pending',
            'meeting_link' => null,
            'session_format' => null,
            'location' => null,
            'session_notes' => null,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => [
            'status' => 'accepted',
            'session_format' => 'online',
            'meeting_link' => 'https://meet.example.com/' . fake()->lexify('????-????'),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }

    public function completed(): static
    {
        return $this->accepted()->state(fn () => [
            'status' => 'completed',
            'scheduled_at' => now()->subDays(2),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => 'cancelled']);
    }
}
