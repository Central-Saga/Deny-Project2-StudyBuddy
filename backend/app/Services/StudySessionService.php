<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\StudySession;
use App\Models\User;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class StudySessionService
{
    public function __construct(
        private readonly GroupRepositoryInterface $groups
    ) {}

    public function list(User $user): Collection
    {
        return $this->groups->listSessionsForUser($user->id);
    }

    public function create(array $validated, User $user): StudySession
    {
        $group = $this->groups->findGroupOrFail($validated['study_group_id']);

        if ((int) $group->creator_id !== (int) $user->id) {
            throw new DomainException(
                'Hanya ketua grup yang dapat membuat sesi belajar.',
                403
            );
        }

        try {
            $session = $this->groups->transaction(function () use ($validated, $user, $group) {
                $session = $this->groups->createSession([
                    'host_id' => $user->id,
                    'study_group_id' => $group->id,
                    'subject_id' => $group->subject_id,
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'meeting_link' => $validated['meeting_link'] ?? null,
                    'max_participants' => $validated['max_participants'],
                    'scheduled_at' => $validated['scheduled_at'],
                    'duration_minutes' => $validated['duration_minutes'],
                    'status' => 'scheduled',
                ]);

                // Host otomatis menjadi participant.
                $this->groups->createParticipant($session, [
                    'user_id' => $user->id,
                    'role' => 'host',
                    'status' => 'accepted',
                    'joined_at' => now(),
                ]);

                return $session;
            });
        } catch (\Throwable $e) {
            report($e);

            throw new DomainException('Gagal membuat sesi belajar.', 500);
        }

        // Notifikasi best-effort; kegagalan tidak membatalkan sesi.
        try {
            foreach ($this->groups->acceptedMemberUserIds($group, $user->id) as $memberUserId) {
                $this->groups->insertNotification(
                    'session',
                    (int) $memberUserId,
                    'Sesi belajar baru',
                    "Sesi \"{$session->title}\" telah dijadwalkan di grup {$group->name}.",
                    [
                        'session_id' => (int) $session->id,
                        'group_id' => (int) $group->id,
                        'group_name' => $group->name,
                        'scheduled_at' => $session->scheduled_at,
                    ]
                );
            }
        } catch (\Throwable $e) {
            report($e);
        }

        $this->groups->loadSessionDetail($session);
        $session->setAttribute('is_joined', true);

        return $session;
    }

    public function detail(StudySession $session, User $user): StudySession
    {
        $this->groups->loadSessionGroupMembers($session);

        if (! $this->groups->isAcceptedMember($session->studyGroup, $user->id)) {
            throw new DomainException(
                'Anda tidak memiliki akses ke sesi ini.',
                403
            );
        }

        $this->groups->loadSessionDetail($session);
        $session->setAttribute(
            'is_joined',
            $this->groups->isAcceptedParticipant($session, $user->id)
        );

        return $session;
    }

    public function update(StudySession $session, array $validated, User $user): StudySession
    {
        if ((int) $session->host_id !== (int) $user->id) {
            throw new DomainException('Hanya host yang dapat mengubah sesi.', 403);
        }

        if ($session->status !== 'scheduled') {
            throw new DomainException(
                'Sesi yang sudah berjalan/selesai tidak dapat diubah.',
                422
            );
        }

        if (
            isset($validated['max_participants']) &&
            $validated['max_participants'] < $this->groups->countAcceptedParticipants($session)
        ) {
            throw new DomainException(
                'Kapasitas baru tidak boleh lebih kecil dari jumlah peserta saat ini.',
                422
            );
        }

        // Group dan subject sesi tidak boleh diganti melalui update.
        unset($validated['study_group_id'], $validated['subject_id']);

        $this->groups->updateSession($session, $validated);
        $session->refresh();

        $this->groups->loadSessionDetail($session);
        $session->setAttribute('is_joined', true);

        return $session;
    }

    public function cancel(StudySession $session, User $user): void
    {
        if ((int) $session->host_id !== (int) $user->id) {
            throw new DomainException(
                'Hanya host yang dapat membatalkan sesi.',
                403
            );
        }

        if ($session->status !== 'scheduled') {
            throw new DomainException(
                'Sesi ini sudah tidak dapat dibatalkan.',
                422
            );
        }

        $this->groups->updateSession($session, ['status' => 'cancelled']);
    }
}
