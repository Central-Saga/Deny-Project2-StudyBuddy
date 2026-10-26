<?php

namespace App\Services;

use App\Repositories\Contracts\TutoringRepositoryInterface;
use App\Services\Tutoring\TutoringException;
use App\Services\Tutoring\TutoringSessionRules;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TutoringService
{
    public function __construct(
        private TutoringRepositoryInterface $repository,
        private TutoringSessionRules $rules
    ) {
    }

    public function listTutors(int $userId, array $filters): Collection
    {
        $profiles = $this->repository->searchActiveTutors($userId, $filters);

        if ($profiles->isEmpty()) {
            return collect();
        }

        $profileIds = $profiles->pluck('id');
        $subjects = $this->repository->subjectsForProfiles($profileIds);
        $availability = $this->repository->availabilityForProfiles($profileIds);

        return $profiles->map(fn ($profile) => [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'name' => $profile->name,
            'email' => $profile->email,
            'avatar_url' => $this->resolveAvatarUrl($profile->avatar_url),
            'bio' => $profile->bio,
            'hourly_rate' => (float) $profile->hourly_rate,
            'is_verified' => (bool) $profile->is_verified,
            'status' => $profile->status,
            'rating_avg' => (float) $profile->rating_avg,
            'reviews_count' => (int) $profile->reviews_count,
            'format_online' => (bool) $profile->format_online,
            'format_offline' => (bool) $profile->format_offline,
            'last_active_at' => $profile->last_active_at,
            'subjects' => $subjects->get($profile->id, collect())->values(),
            'availability' => $availability->get($profile->id, collect())->values(),
        ])->values();
    }

    public function myProfile(int $userId): ?array
    {
        $profile = $this->repository->findProfileByUserId($userId);

        if (!$profile) {
            return null;
        }

        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'bio' => $profile->bio,
            'hourly_rate' => (float) $profile->hourly_rate,
            'is_verified' => (bool) $profile->is_verified,
            'status' => $profile->status,
            'rating_avg' => (float) $profile->rating_avg,
            'reviews_count' => (int) $profile->reviews_count,
            'format_online' => (bool) $profile->format_online,
            'format_offline' => (bool) $profile->format_offline,
            'subject_ids' => $this->repository->subjectIdsOf($profile->id),
            'availability' => $this->repository->availabilityOf($profile->id),
        ];
    }

    public function saveProfile(int $userId, array $validated): object
    {
        if (!$validated['format_online'] && !$validated['format_offline']) {
            throw new TutoringException(
                'Pilih minimal satu format tutoring: online atau offline.',
                422
            );
        }

        foreach ($validated['availability'] as $slot) {
            if ($slot['end_time'] <= $slot['start_time']) {
                throw new TutoringException(
                    'Jam selesai availability harus setelah jam mulai.',
                    422
                );
            }
        }

        $profileId = $this->repository->transaction(function () use ($validated, $userId) {
            $now = now();
            $existing = $this->repository->findProfileByUserId($userId);

            if ($existing) {
                $this->repository->updateProfile($existing->id, [
                    'bio' => $validated['bio'] ?? null,
                    'format_online' => $validated['format_online'],
                    'format_offline' => $validated['format_offline'],
                    'updated_at' => $now,
                ]);

                $profileId = $existing->id;
            } else {
                $profileId = $this->repository->insertProfile([
                    'user_id' => $userId,
                    'bio' => $validated['bio'] ?? null,
                    'hourly_rate' => 0,
                    'is_verified' => false,
                    'status' => 'active',
                    'rating_avg' => 0,
                    'reviews_count' => 0,
                    'format_online' => $validated['format_online'],
                    'format_offline' => $validated['format_offline'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $subjectRows = [];
            foreach (array_unique($validated['subject_ids']) as $subjectId) {
                $subjectRows[] = [
                    'tutor_profile_id' => $profileId,
                    'subject_id' => $subjectId,
                    'proficiency_level' => 'advanced',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            $this->repository->replaceSubjects($profileId, $subjectRows);

            $availabilityRows = [];
            foreach ($validated['availability'] as $slot) {
                $availabilityRows[] = [
                    'tutor_profile_id' => $profileId,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'is_recurring' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            $this->repository->replaceAvailability($profileId, $availabilityRows);

            return $profileId;
        });

        return $this->repository->findProfile($profileId);
    }

    public function updateProfileStatus(int $userId, string $status): void
    {
        $profile = $this->repository->findProfileByUserId($userId);

        if (!$profile) {
            throw new TutoringException('Profil tutor belum dibuat.', 404);
        }

        $this->repository->updateProfile($profile->id, [
            'status' => $status,
            'updated_at' => now(),
        ]);
    }

    public function requests(int $userId): array
    {
        return [
            'outgoing' => $this->repository->outgoingRequests($userId),
            'incoming' => $this->repository->incomingRequests($userId),
        ];
    }

    public function createRequest(int $userId, array $validated): int
    {
        $tutor = $this->repository->findActiveProfile((int) $validated['tutor_profile_id']);

        if (!$tutor) {
            throw new TutoringException('Tutor tidak aktif atau tidak ditemukan.', 404);
        }

        if ((int) $tutor->user_id === $userId) {
            throw new TutoringException(
                'Anda tidak dapat mengajukan sesi kepada diri sendiri.',
                422
            );
        }

        if (!$this->repository->tutorOffersSubject($tutor->id, (int) $validated['subject_id'])) {
            throw new TutoringException('Tutor tersebut tidak mengajar mata kuliah ini.', 422);
        }

        $normalizedTopic = Str::lower(trim($validated['topic']));

        if ($this->repository->hasActiveDuplicateRequest($userId, $tutor->id, $normalizedTopic)) {
            throw new TutoringException(
                'Anda sudah memiliki request aktif untuk tutor dan topik yang sama.',
                422
            );
        }

        if (!$this->rules->tutorIsAvailable(
            (int) $tutor->id,
            $validated['scheduled_at'],
            (int) $validated['duration_minutes']
        )) {
            throw new TutoringException(
                'Jadwal yang dipilih berada di luar availability tutor.',
                422
            );
        }

        return $this->repository->transaction(function () use ($validated, $userId, $tutor) {
            $now = now();

            $id = $this->repository->insertRequest([
                'student_id' => $userId,
                'tutor_profile_id' => $tutor->id,
                'subject_id' => $validated['subject_id'],
                'topic' => trim($validated['topic']),
                'notes' => $validated['notes'] ?? null,
                'scheduled_at' => $validated['scheduled_at'],
                'duration_minutes' => $validated['duration_minutes'],
                'status' => 'pending',
                'meeting_link' => null,
                'session_format' => null,
                'location' => null,
                'session_notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->rules->notify(
                (int) $tutor->user_id,
                'Permintaan tutoring baru',
                "Ada permintaan tutoring untuk topik: {$validated['topic']}.",
                [
                    'request_id' => $id,
                    'topic' => $validated['topic'],
                    'status' => 'pending',
                ]
            );

            return $id;
        });
    }

    /**
     * @param callable():array $sessionInput Mengambil input sesi yang divalidasi (dipanggil hanya saat accepted).
     */
    public function updateStatus(int $id, int $userId, string $status, callable $sessionInput): object
    {
        $row = $this->repository->findRequest($id);

        if (!$row) {
            throw new TutoringException('Permintaan tidak ditemukan.', 404);
        }

        $profile = $this->repository->findProfile((int) $row->tutor_profile_id);

        $isStudent = (int) $row->student_id === $userId;
        $isTutor = $profile && (int) $profile->user_id === $userId;

        if (!$isStudent && !$isTutor) {
            throw new TutoringException(
                'Anda tidak memiliki akses ke permintaan tutoring ini.',
                403
            );
        }

        $invalid = new TutoringException('Status tidak dapat diubah untuk permintaan ini.', 422);

        if ($isStudent && ($row->status !== 'pending' || $status !== 'cancelled')) {
            throw $invalid;
        }

        if ($isTutor) {
            $validTutorTransition =
                ($row->status === 'pending' && in_array($status, ['accepted', 'rejected'], true))
                || ($row->status === 'accepted' && $status === 'completed');

            if (!$validTutorTransition) {
                throw $invalid;
            }
        }

        $updates = ['status' => $status, 'updated_at' => now()];

        if ($status === 'accepted') {
            $updates = array_merge(
                $updates,
                $this->rules->sessionPayload($sessionInput(), (int) $row->tutor_profile_id)
            );
        }

        $this->repository->updateRequest($id, $updates);

        $this->rules->notify(
            $isStudent ? (int) $profile->user_id : (int) $row->student_id,
            'Status tutoring diperbarui',
            "Status permintaan tutoring #{$id} sekarang: {$status}.",
            ['request_id' => $id, 'status' => $status]
        );

        return $this->repository->findRequest($id);
    }

    /**
     * @param callable():array $sessionInput Mengambil input sesi yang divalidasi.
     */
    public function updateSession(int $id, int $userId, callable $sessionInput): object
    {
        $row = $this->repository->findRequest($id);

        if (!$row) {
            throw new TutoringException('Permintaan tidak ditemukan.', 404);
        }

        $profile = $this->repository->findProfile((int) $row->tutor_profile_id);

        if (!$profile || (int) $profile->user_id !== $userId) {
            throw new TutoringException(
                'Hanya tutor terkait yang dapat mengubah detail sesi.',
                403
            );
        }

        if ($row->status !== 'accepted') {
            throw new TutoringException(
                'Detail sesi hanya dapat diubah setelah request diterima.',
                422
            );
        }

        $session = $this->rules->sessionPayload($sessionInput(), (int) $row->tutor_profile_id);
        $session['updated_at'] = now();

        $this->repository->updateRequest($id, $session);

        $this->rules->notify(
            (int) $row->student_id,
            'Detail sesi tutoring diperbarui',
            "Detail sesi tutoring untuk topik {$row->topic} telah diperbarui.",
            ['request_id' => $id, 'status' => 'accepted']
        );

        return $this->repository->findRequest($id);
    }

    private function resolveAvatarUrl(?string $avatar): ?string
    {
        if (!$avatar) {
            return null;
        }

        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }

        return url(Storage::disk('public')->url($avatar));
    }
}
