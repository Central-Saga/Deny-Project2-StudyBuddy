<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\User;
use App\Models\UserSubject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserSubject>
 */
class UserSubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'proficiency_level' => 'beginner',
            'type' => 'learning',
        ];
    }

    public function teaching(): static
    {
        return $this->state(fn () => [
            'proficiency_level' => 'advanced',
            'type' => 'teaching',
        ]);
    }
}
