<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\StudySession;
use App\Models\User;
use App\Repositories\Contracts\GroupRepositoryInterface;

class SessionParticipantService
{
    public function __construct(
        private readonly GroupRepositoryInterface $groups
    ) {}

    public function join(StudySession $studySession, User $user): string
    {
        try {
            $result = $this->groups->transaction(function () use ($studySession, $user) {
                // Lock session agar pengecekan kapasitas aman dari join bersamaan.
                $session = $this->groups->lockSessionWithGroup($studySession->id);

                if ($session->status !== 'scheduled') {
                    return [422, 'Sesi sudah tidak dapat diikuti.'];
                }

                if (! $this->groups->isAcceptedMember($session->studyGroup, $user->id)) {
                    return [403, 'Anda harus menjadi anggota aktif grup terlebih dahulu.'];
                }

                $existing = $this->groups->findParticipant($session, $user->id);

                if ($existing && $existing->status === 'accepted') {
                    return [422, 'Anda sudah terdaftar sebagai peserta sesi.'];
                }

                if (
                    $this->groups->countAcceptedParticipants($session) >=
                    $session->max_participants
                ) {
                    return [422, 'Sesi sudah penuh.'];
                }

                $attributes = [
                    'role' => 'participant',
                    'status' => 'accepted',
                    'joined_at' => now(),
                ];

                if ($existing) {
                    // Pernah keluar, aktifkan kembali.
                    $this->groups->updateParticipant($existing, $attributes);
                } else {
                    $this->groups->createParticipant(
                        $session,
                        ['user_id' => $user->id] + $attributes
                    );
                }

                return [200, 'Berhasil bergabung ke sesi.'];
            });
        } catch (\Throwable $e) {
            report($e);

            throw new DomainException('Gagal bergabung ke sesi.', 500);
        }

        [$status, $message] = $result;

        if ($status !== 200) {
            throw new DomainException($message, $status);
        }

        return $message;
    }

    public function leave(StudySession $studySession, User $user): string
    {
        $participant = $this->groups->findParticipant($studySession, $user->id);

        if (! $participant || $participant->status !== 'accepted') {
            throw new DomainException('Anda bukan peserta aktif sesi ini.', 422);
        }

        // Host tidak boleh meninggalkan sesi.
        if ($studySession->host_id === $user->id || $participant->role === 'host') {
            throw new DomainException(
                'Host tidak dapat keluar dari sesi. Batalkan sesi jika sudah tidak digunakan.',
                422
            );
        }

        try {
            $this->groups->updateParticipant($participant, [
                'status' => 'left',
                'joined_at' => null,
            ]);
        } catch (\Throwable $e) {
            report($e);

            throw new DomainException('Gagal keluar dari sesi.', 500);
        }

        return 'Berhasil keluar dari sesi.';
    }
}
