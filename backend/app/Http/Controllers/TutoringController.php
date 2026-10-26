<?php

namespace App\Http\Controllers;

use App\Services\Tutoring\TutoringException;
use App\Services\TutoringService;
use Illuminate\Http\Request;

class TutoringController extends Controller
{
    public function __construct(private TutoringService $service)
    {
    }

    public function tutors(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'format' => ['nullable', 'in:online,offline'],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6', 'required_with:time'],
            'time' => ['nullable', 'date_format:H:i'],
        ]);

        return response()->json(
            $this->service->listTutors($request->user()->id, $validated)
        );
    }

    public function myProfile(Request $request)
    {
        return response()->json($this->service->myProfile($request->user()->id));
    }

    public function saveProfile(Request $request)
    {
        $validated = $request->validate([
            'bio' => ['nullable', 'string', 'max:5000'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
            'format_online' => ['required', 'boolean'],
            'format_offline' => ['required', 'boolean'],
            'availability' => ['required', 'array', 'min:1'],
            'availability.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'availability.*.start_time' => ['required', 'date_format:H:i'],
            'availability.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        try {
            $profile = $this->service->saveProfile($request->user()->id, $validated);
        } catch (TutoringException $e) {
            return $this->error($e);
        }

        return response()->json([
            'message' => 'Profil tutor berhasil disimpan.',
            'data' => $profile,
        ]);
    }

    public function updateProfileStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        try {
            $this->service->updateProfileStatus($request->user()->id, $validated['status']);
        } catch (TutoringException $e) {
            return $this->error($e);
        }

        return response()->json([
            'message' => $validated['status'] === 'active'
                ? 'Mode tutor berhasil diaktifkan.'
                : 'Mode tutor berhasil dinonaktifkan.',
            'status' => $validated['status'],
        ]);
    }

    public function requests(Request $request)
    {
        return response()->json($this->service->requests($request->user()->id));
    }

    public function createRequest(Request $request)
    {
        $validated = $request->validate([
            'tutor_profile_id' => ['required', 'integer', 'exists:tutor_profiles,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'topic' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:240'],
        ]);

        try {
            $requestId = $this->service->createRequest($request->user()->id, $validated);
        } catch (TutoringException $e) {
            return $this->error($e);
        }

        return response()->json([
            'message' => 'Permintaan tutoring berhasil dikirim.',
            'request_id' => $requestId,
        ], 201);
    }

    public function updateStatus(int $id, Request $request)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected,completed,cancelled'],
        ]);

        try {
            $data = $this->service->updateStatus(
                $id,
                $request->user()->id,
                $validated['status'],
                fn () => $this->validatedSession($request)
            );
        } catch (TutoringException $e) {
            return $this->error($e);
        }

        return response()->json([
            'message' => 'Status tutoring berhasil diperbarui.',
            'data' => $data,
        ]);
    }

    public function updateSession(int $id, Request $request)
    {
        try {
            $data = $this->service->updateSession(
                $id,
                $request->user()->id,
                fn () => $this->validatedSession($request)
            );
        } catch (TutoringException $e) {
            return $this->error($e);
        }

        return response()->json([
            'message' => 'Detail sesi tutoring berhasil diperbarui.',
            'data' => $data,
        ]);
    }

    private function validatedSession(Request $request): array
    {
        return $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:240'],
            'session_format' => ['required', 'in:online,offline'],
            'meeting_link' => ['nullable', 'url', 'max:1000'],
            'location' => ['nullable', 'string', 'max:500'],
            'session_notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    private function error(TutoringException $e)
    {
        return response()->json(['message' => $e->getMessage()], $e->status());
    }
}
