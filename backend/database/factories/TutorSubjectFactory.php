<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\TutorSubject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorSubject>
 */
class TutorSubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tutor_profile_id' => TutorProfile::factory(),
            'subject_id' => Subject::factory(),
            'proficiency_level' => 'advanced',
        ];
    }
}
