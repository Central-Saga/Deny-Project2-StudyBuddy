<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTutoringReviewRequest;
use App\Http\Resources\TutoringReviewResource;
use App\Models\TutoringRequest;
use App\Models\TutoringReview;
use App\Models\TutorProfile;
use Illuminate\Support\Facades\DB;

class TutoringReviewController extends Controller
{
    /**
     * Membuat review setelah sesi tutoring selesai.
     */
    public function store(
        StoreTutoringReviewRequest $request,
        TutoringRequest $tutoringRequest
    ) {
        $user = $request->user();

        // Hanya student pemilik request yang boleh memberi review.
        if ((int) $tutoringRequest->student_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk memberi review pada sesi ini.',
            ], 403);
        }

        // Review hanya boleh diberikan setelah tutoring selesai.
        if ($tutoringRequest->status !== 'completed') {
            return response()->json([
                'message' => 'Review hanya dapat diberikan setelah sesi tutoring selesai.',
            ], 422);
        }

        $validated = $request->validated();

        /*
         * Cegah satu tutoring request memiliki lebih dari satu review.
         */
        $existingReview = TutoringReview::query()
            ->where('tutoring_request_id', $tutoringRequest->id)
            ->exists();

        if ($existingReview) {
            return response()->json([
                'message' => 'Sesi tutoring ini sudah pernah direview.',
            ], 422);
        }

        $review = DB::transaction(function () use (
            $validated,
            $tutoringRequest,
            $user
        ) {
            $review = TutoringReview::create([
                'tutoring_request_id' => $tutoringRequest->id,
                'student_id' => $user->id,
                'tutor_profile_id' => $tutoringRequest->tutor_profile_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            /*
             * Hitung ulang rating tutor berdasarkan seluruh review.
             */
            $statistics = TutoringReview::query()
                ->where(
                    'tutor_profile_id',
                    $tutoringRequest->tutor_profile_id
                )
                ->selectRaw(
                    'COUNT(*) as reviews_count, AVG(rating) as rating_avg'
                )
                ->first();

            TutorProfile::query()
                ->whereKey($tutoringRequest->tutor_profile_id)
                ->update([
                    'rating_avg' => round(
                        (float) $statistics->rating_avg,
                        2
                    ),
                    'reviews_count' => (int) $statistics->reviews_count,
                ]);

            return $review;
        });

        $review->load([
            'student:id,name',
        ]);

        return response()->json([
            'message' => 'Review tutoring berhasil dikirim.',
            'data' => (new TutoringReviewResource($review))
                ->resolve($request),
        ], 201);
    }
}