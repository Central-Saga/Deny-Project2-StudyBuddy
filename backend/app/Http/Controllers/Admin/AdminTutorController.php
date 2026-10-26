<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TutorProfile;
use App\Services\AdminTutorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTutorController extends Controller
{
    public function __construct(private AdminTutorService $service)
    {
    }

    /**
     * Daftar seluruh tutor.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'verification' => ['nullable', Rule::in(['verified', 'unverified'])],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        return response()->json([
            'message' => 'Daftar tutor berhasil diambil.',
            'data' => $this->service->list($validated),
        ]);
    }

    /**
     * Detail tutor.
     */
    public function show(TutorProfile $tutorProfile): JsonResponse
    {
        $data = $this->service->detail($tutorProfile->id);

        if (!$data) {
            return response()->json(['message' => 'Tutor tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail tutor berhasil diambil.',
            'data' => $data,
        ]);
    }

    /**
     * Verify / Unverify tutor.
     */
    public function updateVerification(
        Request $request,
        TutorProfile $tutorProfile
    ): JsonResponse {
        $validated = $request->validate([
            'is_verified' => ['required', 'boolean'],
        ]);

        $verified = (bool) $validated['is_verified'];

        $data = $this->service->updateVerification(
            $tutorProfile,
            $verified,
            $request->user()->id
        );

        return response()->json([
            'message' => $verified
                ? 'Tutor berhasil diverifikasi.'
                : 'Verifikasi tutor berhasil dibatalkan.',
            'data' => $data,
        ]);
    }
}
