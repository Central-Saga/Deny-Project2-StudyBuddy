<?php

namespace App\Services\Tutoring;

use App\Repositories\Contracts\TutoringRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TutoringSessionRules
{
    public function __construct(private TutoringRepositoryInterface $repository)
    {
    }

    public function tutorIsAvailable(
        int $tutorProfileId,
        string $scheduledAt,
        int $durationMinutes
    ): bool {
        $start = Carbon::parse($scheduledAt);
        $end = $start->copy()->addMinutes($durationMinutes);

        if ($start->dayOfWeek !== $end->dayOfWeek) {
            return false;
        }

        return $this->repository->hasAvailabilityCovering(
            $tutorProfileId,
            $start->dayOfWeek,
            $start->format('H:i:s'),
            $end->format('H:i:s')
        );
    }

    /**
     * @param array $session Input yang sudah divalidasi oleh controller.
     */
    public function sessionPayload(array $session, int $tutorProfileId): array
    {
        $profile = $this->repository->findProfile($tutorProfileId);

        if (!$profile) {
            throw ValidationException::withMessages([
                'session_format' => 'Profil tutor tidak ditemukan.',
            ]);
        }

        if ($session['session_format'] === 'online' && !$profile->format_online) {
            throw ValidationException::withMessages([
                'session_format' => 'Tutor tidak menyediakan format online.',
            ]);
        }

        if ($session['session_format'] === 'offline' && !$profile->format_offline) {
            throw ValidationException::withMessages([
                'session_format' => 'Tutor tidak menyediakan format offline.',
            ]);
        }

        if ($session['session_format'] === 'online' && empty($session['meeting_link'])) {
            throw ValidationException::withMessages([
                'meeting_link' => 'Meeting link wajib diisi untuk sesi online.',
            ]);
        }

        if ($session['session_format'] === 'offline' && empty($session['location'])) {
            throw ValidationException::withMessages([
                'location' => 'Lokasi wajib diisi untuk sesi offline.',
            ]);
        }

        if (!$this->tutorIsAvailable(
            $tutorProfileId,
            $session['scheduled_at'],
            (int) $session['duration_minutes']
        )) {
            throw ValidationException::withMessages([
                'scheduled_at' => 'Jadwal sesi berada di luar availability tutor.',
            ]);
        }

        if ($session['session_format'] === 'online') {
            $session['location'] = null;
        } else {
            $session['meeting_link'] = null;
        }

        return $session;
    }

    public function notify(
        int $userId,
        string $title,
        string $message,
        array $extra = []
    ): void {
        $this->repository->insertNotification([
            'id' => (string) Str::uuid(),
            'type' => 'tutoring',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $userId,
            'data' => json_encode(
                array_merge(['title' => $title, 'message' => $message], $extra),
                JSON_UNESCAPED_UNICODE
            ),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
