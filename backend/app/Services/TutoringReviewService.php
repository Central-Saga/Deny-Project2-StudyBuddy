<?php

namespace App\Services;

use App\Models\TutoringRequest;
use App\Models\TutoringReview;
use App\Models\TutorProfile;
use App\Repositories\Contracts\TutoringRepositoryInterface;
use App\Services\Tutoring\TutoringException;
use Illuminate\Support\Collection;

class TutoringReviewService
{
    public function __construct(private TutoringRepositoryInterface $repository)
    {
    }

    public function listForTutor(TutorProfile $tutorProfile): array
    {
        $reviews = $this->repository->reviewsForTutor($tutorProfile->id);

        return [
            'tutor' => [
                'id' => $tutorProfile->id,
                'rating_avg' => (float) $tutorProfile->rating_avg,
                'reviews_count' => (int) $tutorProfile->reviews_count,
            ],
            'data' => $this->mapReviews($reviews),
        ];
    }

    public function createReview(
        TutoringRequest $tutoringRequest,
        int $userId,
        array $validated
    ): TutoringReview {
        // Hanya student pemilik request yang boleh memberi review.
        if ((int) $tutoringRequest->student_id !== $userId) {
            throw new TutoringException(
                'Anda tidak memiliki akses untuk memberi review pada sesi ini.',
                403
            );
        }

        // Review hanya boleh diberikan setelah tutoring selesai.
        if ($tutoringRequest->status !== 'completed') {
            throw new TutoringException(
                'Review hanya dapat diberikan setelah sesi tutoring selesai.',
                422
            );
        }

        if ($this->repository->reviewExistsForRequest($tutoringRequest->id)) {
            throw new TutoringException('Sesi tutoring ini sudah pernah direview.', 422);
        }

        $review = $this->repository->transaction(function () use ($validated, $tutoringRequest, $userId) {
            $review = $this->repository->createReview([
                'tutoring_request_id' => $tutoringRequest->id,
                'student_id' => $userId,
                'tutor_profile_id' => $tutoringRequest->tutor_profile_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            $this->repository->refreshTutorRating($tutoringRequest->tutor_profile_id);

            return $review;
        });

        $review->load(['student:id,name']);

        return $review;
    }

    private function mapReviews(Collection $reviews): Collection
    {
        return $reviews->map(fn (TutoringReview $review) => [
            'id' => $review->id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'student' => $review->student ? [
                'id' => $review->student->id,
                'name' => $review->student->name,
            ] : null,
            'created_at' => $review->created_at?->toIso8601String(),
        ])->values();
    }
}
