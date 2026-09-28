<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TutoringController extends Controller
{
    public function tutors(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'format' => ['nullable', 'in:online,offline'],
            'day_of_week' => [
                'nullable',
                'integer',
                'min:0',
                'max:6',
                'required_with:time',
            ],
            'time' => ['nullable', 'date_format:H:i'],
        ]);

        $query = DB::table('tutor_profiles as tp')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->leftJoin('profiles as p', 'p.user_id', '=', 'u.id')
            ->where('tp.status', 'active')
            ->where('tp.user_id', '<>', $request->user()->id);

        if (!empty($validated['subject_id'])) {
            $subjectId = (int) $validated['subject_id'];

            $query->whereExists(function ($subjectQuery) use ($subjectId) {
                $subjectQuery
                    ->select(DB::raw(1))
                    ->from('tutor_subjects as ts_filter')
                    ->whereColumn('ts_filter.tutor_profile_id', 'tp.id')
                    ->where('ts_filter.subject_id', $subjectId);
            });
        }

        if (($validated['format'] ?? null) === 'online') {
            $query->where('tp.format_online', true);
        }

        if (($validated['format'] ?? null) === 'offline') {
            $query->where('tp.format_offline', true);
        }

        if (array_key_exists('day_of_week', $validated)) {
            $dayOfWeek = (int) $validated['day_of_week'];
            $time = $validated['time'] ?? null;

            $query->whereExists(function ($availabilityQuery) use ($dayOfWeek, $time) {
                $availabilityQuery
                    ->select(DB::raw(1))
                    ->from('tutor_availabilities as ta_filter')
                    ->whereColumn('ta_filter.tutor_profile_id', 'tp.id')
                    ->where('ta_filter.day_of_week', $dayOfWeek);

                if ($time) {
                    $availabilityQuery
                        ->where('ta_filter.start_time', '<=', $time)
                        ->where('ta_filter.end_time', '>', $time);
                }
            });
        }

        $profiles = $query
            ->orderByDesc('u.last_active_at')
            ->orderByDesc('tp.rating_avg')
            ->orderByDesc('tp.reviews_count')
            ->select([
                'tp.id',
                'tp.user_id',
                'tp.bio',
                'tp.hourly_rate',
                'tp.is_verified',
                'tp.status',
                'tp.rating_avg',
                'tp.reviews_count',
                'tp.format_online',
                'tp.format_offline',
                'u.name',
                'u.email',
                'u.last_active_at',
                'p.avatar_url',
            ])
            ->get();

        if ($profiles->isEmpty()) {
            return response()->json([]);
        }

        $profileIds = $profiles->pluck('id');

        $subjects = DB::table('tutor_subjects as ts')
            ->join('subjects as s', 's.id', '=', 'ts.subject_id')
            ->whereIn('ts.tutor_profile_id', $profileIds)
            ->select([
                'ts.tutor_profile_id',
                's.id',
                's.name',
                's.code',
                'ts.proficiency_level',
            ])
            ->get()
            ->groupBy('tutor_profile_id');

        $availability = DB::table('tutor_availabilities')
            ->whereIn('tutor_profile_id', $profileIds)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->groupBy('tutor_profile_id');

        return response()->json(
            $profiles->map(function ($profile) use ($subjects, $availability) {
                return [
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
                    'subjects' => $subjects
                        ->get($profile->id, collect())
                        ->values(),
                    'availability' => $availability
                        ->get($profile->id, collect())
                        ->values(),
                ];
            })->values()
        );
    }

    public function myProfile(Request $request)
    {
        $profile = DB::table('tutor_profiles')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$profile) {
            return response()->json(null);
        }

        return response()->json([
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
            'subject_ids' => DB::table('tutor_subjects')
                ->where('tutor_profile_id', $profile->id)
                ->pluck('subject_id')
                ->map(fn ($id) => (int) $id)
                ->values(),
            'availability' => DB::table('tutor_availabilities')
                ->where('tutor_profile_id', $profile->id)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get()
                ->values(),
        ]);
    }

    public function saveProfile(Request $request)
    {
        $validated = $request->validate([
            'bio' => ['nullable', 'string', 'max:5000'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => [
                'integer',
                'distinct',
                'exists:subjects,id',
            ],
            'format_online' => ['required', 'boolean'],
            'format_offline' => ['required', 'boolean'],
            'availability' => ['required', 'array', 'min:1'],
            'availability.*.day_of_week' => [
                'required',
                'integer',
                'min:0',
                'max:6',
            ],
            'availability.*.start_time' => [
                'required',
                'date_format:H:i',
            ],
            'availability.*.end_time' => [
                'required',
                'date_format:H:i',
            ],
        ]);

        if (
            !$validated['format_online']
            && !$validated['format_offline']
        ) {
            return response()->json([
                'message' => 'Pilih minimal satu format tutoring: online atau offline.',
            ], 422);
        }

        foreach ($validated['availability'] as $slot) {
            if ($slot['end_time'] <= $slot['start_time']) {
                return response()->json([
                    'message' => 'Jam selesai availability harus setelah jam mulai.',
                ], 422);
            }
        }

        $profileId = DB::transaction(function () use ($validated, $request) {
            $now = now();

            $existing = DB::table('tutor_profiles')
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existing) {
                DB::table('tutor_profiles')
                    ->where('id', $existing->id)
                    ->update([
                        'bio' => $validated['bio'] ?? null,
                        'format_online' => $validated['format_online'],
                        'format_offline' => $validated['format_offline'],
                        'updated_at' => $now,
                    ]);

                $profileId = $existing->id;
            } else {
                $profileId = DB::table('tutor_profiles')->insertGetId([
                    'user_id' => $request->user()->id,
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

            DB::table('tutor_subjects')
                ->where('tutor_profile_id', $profileId)
                ->delete();

            foreach (array_unique($validated['subject_ids']) as $subjectId) {
                DB::table('tutor_subjects')->insert([
                    'tutor_profile_id' => $profileId,
                    'subject_id' => $subjectId,
                    'proficiency_level' => 'advanced',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('tutor_availabilities')
                ->where('tutor_profile_id', $profileId)
                ->delete();

            foreach ($validated['availability'] as $slot) {
                DB::table('tutor_availabilities')->insert([
                    'tutor_profile_id' => $profileId,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'is_recurring' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            return $profileId;
        });

        return response()->json([
            'message' => 'Profil tutor berhasil disimpan.',
            'data' => DB::table('tutor_profiles')
                ->where('id', $profileId)
                ->first(),
        ]);
    }

    public function updateProfileStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $profile = DB::table('tutor_profiles')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$profile) {
            return response()->json([
                'message' => 'Profil tutor belum dibuat.',
            ], 404);
        }

        DB::table('tutor_profiles')
            ->where('id', $profile->id)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => $validated['status'] === 'active'
                ? 'Mode tutor berhasil diaktifkan.'
                : 'Mode tutor berhasil dinonaktifkan.',
            'status' => $validated['status'],
        ]);
    }

    public function requests(Request $request)
    {
        $userId = $request->user()->id;

        $outgoing = DB::table('tutoring_requests as tr')
            ->join(
                'tutor_profiles as tp',
                'tp.id',
                '=',
                'tr.tutor_profile_id'
            )
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->leftJoin(
                'tutoring_reviews as rev',
                'rev.tutoring_request_id',
                '=',
                'tr.id'
            )
            ->where('tr.student_id', $userId)
            ->orderByDesc('tr.created_at')
            ->select([
                'tr.*',
                'u.name as tutor_name',
                's.name as subject_name',
                'rev.id as review_id',
                'rev.rating as review_rating',
                'rev.comment as review_comment',
            ])
            ->get();

        $incoming = DB::table('tutoring_requests as tr')
            ->join(
                'tutor_profiles as tp',
                'tp.id',
                '=',
                'tr.tutor_profile_id'
            )
            ->join('users as u', 'u.id', '=', 'tr.student_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->where('tp.user_id', $userId)
            ->orderByDesc('tr.created_at')
            ->select([
                'tr.*',
                'u.name as student_name',
                's.name as subject_name',
            ])
            ->get();

        return response()->json([
            'outgoing' => $outgoing,
            'incoming' => $incoming,
        ]);
    }

    public function createRequest(Request $request)
    {
        $validated = $request->validate([
            'tutor_profile_id' => [
                'required',
                'integer',
                'exists:tutor_profiles,id',
            ],
            'subject_id' => [
                'required',
                'integer',
                'exists:subjects,id',
            ],
            'topic' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => [
                'required',
                'integer',
                'min:30',
                'max:240',
            ],
        ]);

        $tutor = DB::table('tutor_profiles')
            ->where('id', $validated['tutor_profile_id'])
            ->where('status', 'active')
            ->first();

        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor tidak aktif atau tidak ditemukan.',
            ], 404);
        }

        if ((int) $tutor->user_id === (int) $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat mengajukan sesi kepada diri sendiri.',
            ], 422);
        }

        $offersSubject = DB::table('tutor_subjects')
            ->where('tutor_profile_id', $tutor->id)
            ->where('subject_id', $validated['subject_id'])
            ->exists();

        if (!$offersSubject) {
            return response()->json([
                'message' => 'Tutor tersebut tidak mengajar mata kuliah ini.',
            ], 422);
        }

        $normalizedTopic = Str::lower(trim($validated['topic']));

        $duplicateActiveRequest = DB::table('tutoring_requests')
            ->where('student_id', $request->user()->id)
            ->where('tutor_profile_id', $tutor->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->whereRaw('LOWER(TRIM(topic)) = ?', [$normalizedTopic])
            ->exists();

        if ($duplicateActiveRequest) {
            return response()->json([
                'message' => 'Anda sudah memiliki request aktif untuk tutor dan topik yang sama.',
            ], 422);
        }

        if (
            !$this->tutorIsAvailable(
                (int) $tutor->id,
                $validated['scheduled_at'],
                (int) $validated['duration_minutes']
            )
        ) {
            return response()->json([
                'message' => 'Jadwal yang dipilih berada di luar availability tutor.',
            ], 422);
        }

        $requestId = DB::transaction(function () use (
            $validated,
            $request,
            $tutor
        ) {
            $now = now();

            $id = DB::table('tutoring_requests')->insertGetId([
                'student_id' => $request->user()->id,
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

            $this->insertNotification(
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

        return response()->json([
            'message' => 'Permintaan tutoring berhasil dikirim.',
            'request_id' => $requestId,
        ], 201);
    }

    public function updateStatus(int $id, Request $request)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:accepted,rejected,completed,cancelled',
            ],
        ]);

        $row = DB::table('tutoring_requests')
            ->where('id', $id)
            ->first();

        if (!$row) {
            return response()->json([
                'message' => 'Permintaan tidak ditemukan.',
            ], 404);
        }

        $profile = DB::table('tutor_profiles')
            ->where('id', $row->tutor_profile_id)
            ->first();

        $userId = $request->user()->id;
        $isStudent = (int) $row->student_id === (int) $userId;
        $isTutor = $profile
            && (int) $profile->user_id === (int) $userId;

        if (!$isStudent && !$isTutor) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke permintaan tutoring ini.',
            ], 403);
        }

        if ($isStudent) {
            if (
                $row->status !== 'pending'
                || $validated['status'] !== 'cancelled'
            ) {
                return response()->json([
                    'message' => 'Status tidak dapat diubah untuk permintaan ini.',
                ], 422);
            }
        }

        if ($isTutor) {
            $validTutorTransition =
                (
                    $row->status === 'pending'
                    && in_array(
                        $validated['status'],
                        ['accepted', 'rejected'],
                        true
                    )
                )
                || (
                    $row->status === 'accepted'
                    && $validated['status'] === 'completed'
                );

            if (!$validTutorTransition) {
                return response()->json([
                    'message' => 'Status tidak dapat diubah untuk permintaan ini.',
                ], 422);
            }
        }

        $updates = [
            'status' => $validated['status'],
            'updated_at' => now(),
        ];

        if ($validated['status'] === 'accepted') {
            $updates = array_merge(
                $updates,
                $this->validatedSessionPayload(
                    $request,
                    (int) $row->tutor_profile_id
                )
            );
        }

        DB::table('tutoring_requests')
            ->where('id', $id)
            ->update($updates);

        $targetUserId = $isStudent
            ? (int) $profile->user_id
            : (int) $row->student_id;

        $this->insertNotification(
            $targetUserId,
            'Status tutoring diperbarui',
            "Status permintaan tutoring #{$id} sekarang: {$validated['status']}.",
            [
                'request_id' => $id,
                'status' => $validated['status'],
            ]
        );

        return response()->json([
            'message' => 'Status tutoring berhasil diperbarui.',
            'data' => DB::table('tutoring_requests')
                ->where('id', $id)
                ->first(),
        ]);
    }

    public function updateSession(int $id, Request $request)
    {
        $row = DB::table('tutoring_requests')
            ->where('id', $id)
            ->first();

        if (!$row) {
            return response()->json([
                'message' => 'Permintaan tidak ditemukan.',
            ], 404);
        }

        $profile = DB::table('tutor_profiles')
            ->where('id', $row->tutor_profile_id)
            ->first();

        if (
            !$profile
            || (int) $profile->user_id !== (int) $request->user()->id
        ) {
            return response()->json([
                'message' => 'Hanya tutor terkait yang dapat mengubah detail sesi.',
            ], 403);
        }

        if ($row->status !== 'accepted') {
            return response()->json([
                'message' => 'Detail sesi hanya dapat diubah setelah request diterima.',
            ], 422);
        }

        $session = $this->validatedSessionPayload(
            $request,
            (int) $row->tutor_profile_id
        );

        $session['updated_at'] = now();

        DB::table('tutoring_requests')
            ->where('id', $id)
            ->update($session);

        $this->insertNotification(
            (int) $row->student_id,
            'Detail sesi tutoring diperbarui',
            "Detail sesi tutoring untuk topik {$row->topic} telah diperbarui.",
            [
                'request_id' => $id,
                'status' => 'accepted',
            ]
        );

        return response()->json([
            'message' => 'Detail sesi tutoring berhasil diperbarui.',
            'data' => DB::table('tutoring_requests')
                ->where('id', $id)
                ->first(),
        ]);
    }

    private function validatedSessionPayload(
        Request $request,
        int $tutorProfileId
    ): array {
        $session = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => [
                'required',
                'integer',
                'min:30',
                'max:240',
            ],
            'session_format' => ['required', 'in:online,offline'],
            'meeting_link' => ['nullable', 'url', 'max:1000'],
            'location' => ['nullable', 'string', 'max:500'],
            'session_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $profile = DB::table('tutor_profiles')
            ->where('id', $tutorProfileId)
            ->first();

        if (!$profile) {
            throw ValidationException::withMessages([
                'session_format' => 'Profil tutor tidak ditemukan.',
            ]);
        }

        if (
            $session['session_format'] === 'online'
            && !$profile->format_online
        ) {
            throw ValidationException::withMessages([
                'session_format' => 'Tutor tidak menyediakan format online.',
            ]);
        }

        if (
            $session['session_format'] === 'offline'
            && !$profile->format_offline
        ) {
            throw ValidationException::withMessages([
                'session_format' => 'Tutor tidak menyediakan format offline.',
            ]);
        }

        if (
            $session['session_format'] === 'online'
            && empty($session['meeting_link'])
        ) {
            throw ValidationException::withMessages([
                'meeting_link' => 'Meeting link wajib diisi untuk sesi online.',
            ]);
        }

        if (
            $session['session_format'] === 'offline'
            && empty($session['location'])
        ) {
            throw ValidationException::withMessages([
                'location' => 'Lokasi wajib diisi untuk sesi offline.',
            ]);
        }

        if (
            !$this->tutorIsAvailable(
                $tutorProfileId,
                $session['scheduled_at'],
                (int) $session['duration_minutes']
            )
        ) {
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

    private function tutorIsAvailable(
        int $tutorProfileId,
        string $scheduledAt,
        int $durationMinutes
    ): bool {
        $start = Carbon::parse($scheduledAt);
        $end = $start->copy()->addMinutes($durationMinutes);

        if ($start->dayOfWeek !== $end->dayOfWeek) {
            return false;
        }

        return DB::table('tutor_availabilities')
            ->where('tutor_profile_id', $tutorProfileId)
            ->where('day_of_week', $start->dayOfWeek)
            ->where('start_time', '<=', $start->format('H:i:s'))
            ->where('end_time', '>=', $end->format('H:i:s'))
            ->exists();
    }

    private function resolveAvatarUrl(?string $avatar): ?string
    {
        if (!$avatar) {
            return null;
        }

        if (
            str_starts_with($avatar, 'http://')
            || str_starts_with($avatar, 'https://')
        ) {
            return $avatar;
        }

        return url(Storage::disk('public')->url($avatar));
    }

    private function insertNotification(
        int $userId,
        string $title,
        string $message,
        array $extra = []
    ): void {
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'tutoring',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $userId,
            'data' => json_encode(
                array_merge([
                    'title' => $title,
                    'message' => $message,
                ], $extra),
                JSON_UNESCAPED_UNICODE
            ),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
