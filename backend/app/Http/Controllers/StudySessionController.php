<?php

namespace App\Http\Controllers;

use App\Models\StudySession;
use App\Models\StudyGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudySessionController extends Controller
{
    /**
     * Menampilkan sesi belajar.
     *
     * Default:
     * - hanya sesi yang terkait group
     * - hanya group yang diikuti user
     * - diurutkan berdasarkan jadwal
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $sessions = StudySession::query()
            ->with([
                'host:id,name',
                'subject:id,name',
                'studyGroup:id,name,slug',
            ])
            ->withCount([
                'participants as participants_count' => function ($query) {
                    $query->where('status', 'accepted');
                }
            ])
            ->whereHas('studyGroup.members', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', 'accepted');
            })
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Daftar sesi berhasil diambil.',
            'data' => $sessions,
        ]);
    }

    /**
     * Membuat sesi belajar baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'study_group_id' => [
                'required',
                'exists:study_groups,id',
            ],
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'meeting_link' => [
                'nullable',
                'url',
                'max:1000',
            ],
            'max_participants' => [
                'required',
                'integer',
                'min:2',
                'max:100',
            ],
            'scheduled_at' => [
                'required',
                'date',
            ],
            'duration_minutes' => [
                'required',
                'integer',
                'min:15',
                'max:480',
            ],
        ]);

        $user = $request->user();

        $group = StudyGroup::findOrFail(
            $validated['study_group_id']
        );

        // User harus menjadi anggota aktif group.
        $membership = $group->members()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        if (!$membership) {
            return response()->json([
                'message' => 'Anda bukan anggota aktif grup ini.',
            ], 403);
        }

        /*
         * Subject session mengikuti subject group.
         * Tidak menerima subject_id dari frontend agar
         * tidak terjadi ketidaksesuaian subject.
         */
        DB::beginTransaction();

        try {
            $session = StudySession::create([
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

            /*
             * Host otomatis menjadi participant.
             */
            $session->participants()->create([
                'user_id' => $user->id,
                'role' => 'host',
                'status' => 'accepted',
                'joined_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Sesi belajar berhasil dibuat.',
                'data' => $session->load([
                    'host:id,name',
                    'subject:id,name',
                    'studyGroup:id,name,slug',
                    'participants.user:id,name',
                ]),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal membuat sesi belajar.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Menampilkan detail satu sesi.
     */
    public function show(Request $request, StudySession $studySession)
    {
        $user = $request->user();

        $isMember = $studySession->studyGroup
            ->members()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke sesi ini.',
            ], 403);
        }

        $studySession->load([
            'host:id,name',
            'subject:id,name',
            'studyGroup:id,name,slug',
            'participants.user:id,name',
        ]);

        $studySession->loadCount([
            'participants as participants_count' => function ($query) {
                $query->where('status', 'accepted');
            }
        ]);

        return response()->json([
            'message' => 'Detail sesi berhasil diambil.',
            'data' => $studySession,
        ]);
    }

    /**
     * Mengubah sesi.
     */
    public function update(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        if ($studySession->host_id !== $user->id) {
            return response()->json([
                'message' => 'Hanya host yang dapat mengubah sesi.',
            ], 403);
        }

        if ($studySession->status !== 'scheduled') {
            return response()->json([
                'message' => 'Sesi yang sudah berjalan/selesai tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'meeting_link' => [
                'nullable',
                'url',
                'max:1000',
            ],
            'max_participants' => [
                'sometimes',
                'required',
                'integer',
                'min:2',
                'max:100',
            ],
            'scheduled_at' => [
                'sometimes',
                'required',
                'date',
            ],
            'duration_minutes' => [
                'sometimes',
                'required',
                'integer',
                'min:15',
                'max:480',
            ],
        ]);

        if (
            isset($validated['max_participants']) &&
            $validated['max_participants'] <
            $studySession->participants()
                ->where('status', 'accepted')
                ->count()
        ) {
            return response()->json([
                'message' => 'Kapasitas baru tidak boleh lebih kecil dari jumlah peserta saat ini.',
            ], 422);
        }

        $studySession->update($validated);

        return response()->json([
            'message' => 'Sesi berhasil diperbarui.',
            'data' => $studySession->fresh()->load([
                'host:id,name',
                'subject:id,name',
                'studyGroup:id,name,slug',
            ]),
        ]);
    }

    /**
     * Membatalkan sesi.
     */
    public function destroy(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        if ($studySession->host_id !== $user->id) {
            return response()->json([
                'message' => 'Hanya host yang dapat membatalkan sesi.',
            ], 403);
        }

        if ($studySession->status !== 'scheduled') {
            return response()->json([
                'message' => 'Sesi ini sudah tidak dapat dibatalkan.',
            ], 422);
        }

        $studySession->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Sesi berhasil dibatalkan.',
        ]);
    }
}