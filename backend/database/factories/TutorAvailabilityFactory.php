<?php

namespace Database\Factories;

use App\Models\TutorAvailability;
use App\Models\TutorProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorAvailability>
 */
class TutorAvailabilityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tutor_profile_id' => TutorProfile::factory(),
            'day_of_week' => fake()->numberBetween(0, 6),
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'is_recurring' => true,
        ];
    }
}
