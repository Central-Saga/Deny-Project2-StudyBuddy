<?php

namespace Database\Factories;

use App\Models\TutoringRequest;
use App\Models\TutoringReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutoringReview>
 */
class TutoringReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            // Review hanya valid untuk permintaan yang sudah selesai.
            'tutoring_request_id' => TutoringRequest::factory()->completed(),
            'student_id' => fn (array $attrs) => TutoringRequest::find($attrs['tutoring_request_id'])->student_id,
            'tutor_profile_id' => fn (array $attrs) => TutoringRequest::find($attrs['tutoring_request_id'])->tutor_profile_id,
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->sentence(),
        ];
    }
}
