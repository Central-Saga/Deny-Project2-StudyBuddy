<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesDomainExceptions;
use App\Models\StudySession;
use App\Services\SessionParticipantService;
use Illuminate\Http\Request;

class SessionParticipantController extends Controller
{
    use HandlesDomainExceptions;

    public function __construct(
        private readonly SessionParticipantService $service
    ) {}

    /**
     * Join ke sesi belajar.
     */
    public function join(Request $request, StudySession $studySession)
    {
        return $this->handle(fn () => response()->json([
            'message' => $this->service->join($studySession, $request->user()),
        ]));
    }

    /**
     * Keluar dari sesi belajar.
     */
    public function leave(Request $request, StudySession $studySession)
    {
        return $this->handle(fn () => response()->json([
            'message' => $this->service->leave($studySession, $request->user()),
        ]));
    }
}
