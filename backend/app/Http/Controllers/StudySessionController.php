<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesDomainExceptions;
use App\Http\Requests\StoreStudySessionRequest;
use App\Http\Requests\UpdateStudySessionRequest;
use App\Http\Resources\StudySessionResource;
use App\Models\StudySession;
use App\Services\StudySessionService;
use Illuminate\Http\Request;

class StudySessionController extends Controller
{
    use HandlesDomainExceptions;

    public function __construct(
        private readonly StudySessionService $service
    ) {}

    public function index(Request $request)
    {
        $sessions = $this->service->list($request->user());

        return response()->json([
            'message' => 'Daftar sesi berhasil diambil.',
            'data' => StudySessionResource::collection($sessions)
                ->resolve($request),
        ]);
    }

    public function store(StoreStudySessionRequest $request)
    {
        return $this->handle(function () use ($request) {
            $session = $this->service->create(
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'message' => 'Sesi belajar berhasil dibuat.',
                'data' => (new StudySessionResource($session))->resolve($request),
            ], 201);
        });
    }

    public function show(Request $request, StudySession $studySession)
    {
        return $this->handle(function () use ($request, $studySession) {
            $session = $this->service->detail($studySession, $request->user());

            return response()->json([
                'message' => 'Detail sesi berhasil diambil.',
                'data' => (new StudySessionResource($session))->resolve($request),
            ]);
        });
    }

    public function update(
        UpdateStudySessionRequest $request,
        StudySession $studySession
    ) {
        return $this->handle(function () use ($request, $studySession) {
            $session = $this->service->update(
                $studySession,
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'message' => 'Sesi berhasil diperbarui.',
                'data' => (new StudySessionResource($session))->resolve($request),
            ]);
        });
    }

    public function destroy(Request $request, StudySession $studySession)
    {
        return $this->handle(function () use ($request, $studySession) {
            $this->service->cancel($studySession, $request->user());

            return response()->json([
                'message' => 'Sesi berhasil dibatalkan.',
            ]);
        });
    }
}
