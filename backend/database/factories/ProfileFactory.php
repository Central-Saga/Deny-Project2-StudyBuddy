<?php

namespace Database\Factories;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Profile>
 */
class ProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'bio' => fake()->sentence(),
            'avatar_url' => null,
            'phone_number' => fake()->numerify('08##########'),
            'university' => fake()->company(),
            'major' => fake()->jobTitle(),
            'github_url' => null,
            'linkedin_url' => null,
        ];
    }
}
