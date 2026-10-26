<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTutoringReviewRequest;
use App\Http\Resources\TutoringReviewResource;
use App\Models\TutoringRequest;
use App\Models\TutorProfile;
use App\Services\Tutoring\TutoringException;
use App\Services\TutoringReviewService;
use Illuminate\Http\Request;

class TutoringReviewController extends Controller
{
    public function __construct(private TutoringReviewService $service)
    {
    }

    /**
     * Menampilkan daftar review untuk satu tutor.
     */
    public function index(Request $request, TutorProfile $tutorProfile)
    {
        return response()->json($this->service->listForTutor($tutorProfile));
    }

    /**
     * Membuat review setelah sesi tutoring selesai.
     */
    public function store(
        StoreTutoringReviewRequest $request,
        TutoringRequest $tutoringRequest
    ) {
        try {
            $review = $this->service->createReview(
                $tutoringRequest,
                $request->user()->id,
                $request->validated()
            );
        } catch (TutoringException $e) {
            return response()->json(['message' => $e->getMessage()], $e->status());
        }

        return response()->json([
            'message' => 'Review tutoring berhasil dikirim.',
            'data' => (new TutoringReviewResource($review))->resolve($request),
        ], 201);
    }
}
