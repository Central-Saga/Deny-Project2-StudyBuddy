<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TutoringController extends Controller
{
    public function tutors(Request $request)
    {
        $profiles = DB::table('tutor_profiles as tp')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->where('tp.status', 'active')
            ->where('tp.user_id', '<>', $request->user()->id)
            ->orderByDesc('tp.rating_avg')
            ->orderByDesc('tp.reviews_count')
            ->select([
                'tp.id', 'tp.user_id', 'tp.bio', 'tp.hourly_rate',
                'tp.is_verified', 'tp.status', 'tp.rating_avg', 'tp.reviews_count',
                'u.name', 'u.email',
            ])
            ->get();

        if ($profiles->isEmpty()) {
            return response()->json([]);
        }

        $profileIds = $profiles->pluck('id');

        $subjects = DB::table('tutor_subjects as ts')
            ->join('subjects as s', 's.id', '=', 'ts.subject_id')
            ->whereIn('ts.tutor_profile_id', $profileIds)
            ->select('ts.tutor_profile_id', 's.id', 's.name', 's.code', 'ts.proficiency_level')
            ->get()
            ->groupBy('tutor_profile_id');

        $availability = DB::table('tutor_availabilities')
            ->whereIn('tutor_profile_id', $profileIds)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->groupBy('tutor_profile_id');

        return response()->json($profiles->map(function ($profile) use ($subjects, $availability) {
            return [
                'id' => $profile->id,
                'user_id' => $profile->user_id,
                'name' => $profile->name,
                'email' => $profile->email,
                'bio' => $profile->bio,
                'hourly_rate' => (float) $profile->hourly_rate,
                'is_verified' => (bool) $profile->is_verified,
                'rating_avg' => (float) $profile->rating_avg,
                'reviews_count' => (int) $profile->reviews_count,
                'subjects' => $subjects->get($profile->id, collect())->values(),
                'availability' => $availability->get($profile->id, collect())->values(),
            ];
        })->values());
    }

    public function myProfile(Request $request)
    {
        $profile = DB::table('tutor_profiles')->where('user_id', $request->user()->id)->first();
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
            'subject_ids' => DB::table('tutor_subjects')->where('tutor_profile_id', $profile->id)->pluck('subject_id')->values(),
            'availability' => DB::table('tutor_availabilities')->where('tutor_profile_id', $profile->id)->orderBy('day_of_week')->get()->values(),
        ]);
    }

    public function saveProfile(Request $request)
    {
        $validated = $request->validate([
            'bio' => ['nullable', 'string', 'max:5000'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
            'availability' => ['nullable', 'array'],
            'availability.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'availability.*.start_time' => ['required', 'date_format:H:i'],
            'availability.*.end_time' => ['required', 'date_format:H:i', 'after:availability.*.start_time'],
        ]);

        $profileId = DB::transaction(function () use ($validated, $request) {
            $now = now();
            $existing = DB::table('tutor_profiles')->where('user_id', $request->user()->id)->first();

            if ($existing) {
                DB::table('tutor_profiles')
                    ->where('id', $existing->id)
                    ->update([
                        'bio' => $validated['bio'] ?? null,
                        'hourly_rate' => $validated['hourly_rate'] ?? 0,
                        'status' => 'active',
                        'updated_at' => $now,
                    ]);
                $profileId = $existing->id;
            } else {
                $profileId = DB::table('tutor_profiles')->insertGetId([
                    'user_id' => $request->user()->id,
                    'bio' => $validated['bio'] ?? null,
                    'hourly_rate' => $validated['hourly_rate'] ?? 0,
                    'is_verified' => false,
                    'status' => 'active',
                    'rating_avg' => 0,
                    'reviews_count' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('tutor_subjects')->where('tutor_profile_id', $profileId)->delete();
            foreach (array_unique($validated['subject_ids']) as $subjectId) {
                DB::table('tutor_subjects')->insert([
                    'tutor_profile_id' => $profileId,
                    'subject_id' => $subjectId,
                    'proficiency_level' => 'advanced',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('tutor_availabilities')->where('tutor_profile_id', $profileId)->delete();
            foreach ($validated['availability'] ?? [] as $slot) {
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
            'data' => DB::table('tutor_profiles')->where('id', $profileId)->first(),
        ]);
    }

    public function requests(Request $request)
    {
        $userId = $request->user()->id;

        $outgoing = DB::table('tutoring_requests as tr')
            ->join('tutor_profiles as tp', 'tp.id', '=', 'tr.tutor_profile_id')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->where('tr.student_id', $userId)
            ->orderByDesc('tr.scheduled_at')
            ->select([
                'tr.*',
                'u.name as tutor_name',
                's.name as subject_name',
            ])
            ->get();

        $incoming = DB::table('tutoring_requests as tr')
            ->join('tutor_profiles as tp', 'tp.id', '=', 'tr.tutor_profile_id')
            ->join('users as u', 'u.id', '=', 'tr.student_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->where('tp.user_id', $userId)
            ->orderByDesc('tr.scheduled_at')
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
            'tutor_profile_id' => ['required', 'integer', 'exists:tutor_profiles,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'topic' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:240'],
        ]);

        $tutor = DB::table('tutor_profiles')->where('id', $validated['tutor_profile_id'])->where('status', 'active')->first();
        if (!$tutor) {
            return response()->json(['message' => 'Tutor tidak aktif atau tidak ditemukan.'], 404);
        }

        if ((int) $tutor->user_id === (int) $request->user()->id) {
            return response()->json(['message' => 'Anda tidak dapat mengajukan sesi kepada diri sendiri.'], 422);
        }

        $offersSubject = DB::table('tutor_subjects')
            ->where('tutor_profile_id', $tutor->id)
            ->where('subject_id', $validated['subject_id'])
            ->exists();

        if (!$offersSubject) {
            return response()->json(['message' => 'Tutor tersebut tidak mengajar mata kuliah ini.'], 422);
        }

        $requestId = DB::transaction(function () use ($validated, $request, $tutor) {
            $now = now();
            $id = DB::table('tutoring_requests')->insertGetId([
                'student_id' => $request->user()->id,
                'tutor_profile_id' => $tutor->id,
                'subject_id' => $validated['subject_id'],
                'topic' => $validated['topic'],
                'notes' => $validated['notes'] ?? null,
                'scheduled_at' => $validated['scheduled_at'],
                'duration_minutes' => $validated['duration_minutes'],
                'status' => 'pending',
                'meeting_link' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->insertNotification(
                (int) $tutor->user_id,
                'Permintaan tutoring baru',
                "Ada permintaan tutoring untuk topik: {$validated['topic']}.",
                ['request_id' => $id, 'topic' => $validated['topic'], 'status' => 'pending']
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
            'status' => ['required', 'in:accepted,rejected,completed,cancelled'],
            'meeting_link' => ['nullable', 'url', 'max:1000'],
        ]);

        $row = DB::table('tutoring_requests')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['message' => 'Permintaan tidak ditemukan.'], 404);
        }

        $profile = DB::table('tutor_profiles')->where('id', $row->tutor_profile_id)->first();
        $userId = $request->user()->id;
        $isStudent = (int) $row->student_id === (int) $userId;
        $isTutor = $profile && (int) $profile->user_id === (int) $userId;

        $allowed = false;
        if ($isStudent) {
            $allowed = $row->status === 'pending' && $validated['status'] === 'cancelled';
        } elseif ($isTutor) {
            $allowed = ($row->status === 'pending' && in_array($validated['status'], ['accepted', 'rejected'], true))
                || ($row->status === 'accepted' && $validated['status'] === 'completed');
        }

        if (!$allowed) {
            return response()->json(['message' => 'Status tidak dapat diubah untuk permintaan ini.'], 422);
        }

        $updates = [
            'status' => $validated['status'],
            'updated_at' => now(),
        ];
        if ($validated['status'] === 'accepted' && array_key_exists('meeting_link', $validated)) {
            $updates['meeting_link'] = $validated['meeting_link'] ?: null;
        }

        DB::table('tutoring_requests')->where('id', $id)->update($updates);

        $targetUserId = $isStudent ? (int) $profile->user_id : (int) $row->student_id;
        $this->insertNotification(
            $targetUserId,
            'Status tutoring diperbarui',
            "Status permintaan tutoring #{$id} sekarang: {$validated['status']}.",
            ['request_id' => $id, 'status' => $validated['status']]
        );

        return response()->json([
            'message' => 'Status tutoring berhasil diperbarui.',
            'data' => DB::table('tutoring_requests')->where('id', $id)->first(),
        ]);
    }

    private function insertNotification(int $userId, string $title, string $message, array $extra = []): void
    {
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'tutoring',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $userId,
            'data' => json_encode(array_merge([
                'title' => $title,
                'message' => $message,
            ], $extra), JSON_UNESCAPED_UNICODE),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
