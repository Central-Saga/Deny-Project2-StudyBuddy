<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudySessionRequest;
use App\Http\Requests\UpdateStudySessionRequest;
use App\Http\Resources\StudySessionResource;
use App\Models\StudyGroup;
use App\Models\StudySession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                },
            ])
            ->whereHas(
                'studyGroup.members',
                function ($query) use ($user) {
                    $query
                        ->where('user_id', $user->id)
                        ->where('status', 'accepted');
                }
            )
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Daftar sesi berhasil diambil.',

            'data' =>
                StudySessionResource::collection($sessions)
                    ->resolve($request),
        ]);
    }

    /**
     * Membuat sesi belajar baru.
     *
     * Hanya creator / ketua grup yang
     * diperbolehkan membuat sesi.
     */
    public function store(StoreStudySessionRequest $request)
    {
        $validated = $request->validated();

        $user = $request->user();

        $group = StudyGroup::findOrFail(
            $validated['study_group_id']
        );

        /*
         * Hanya creator / ketua grup
         * yang boleh membuat sesi belajar.
         */
        if ($group->creator_id !== $user->id) {
            return response()->json([
                'message' =>
                    'Hanya ketua grup yang dapat membuat sesi belajar.',
            ], 403);
        }

        /*
         * Subject sesi otomatis mengikuti
         * subject grup.
         *
         * subject_id tidak diterima dari frontend
         * agar tidak terjadi perbedaan subject.
         */
        DB::beginTransaction();

        try {
            $session = StudySession::create([
                'host_id' =>
                    $user->id,

                'study_group_id' =>
                    $group->id,

                'subject_id' =>
                    $group->subject_id,

                'title' =>
                    $validated['title'],

                'description' =>
                    $validated['description'] ?? null,

                'meeting_link' =>
                    $validated['meeting_link'] ?? null,

                'max_participants' =>
                    $validated['max_participants'],

                'scheduled_at' =>
                    $validated['scheduled_at'],

                'duration_minutes' =>
                    $validated['duration_minutes'],

                'status' =>
                    'scheduled',
            ]);

            /*
             * Ketua / host otomatis menjadi
             * participant sesi.
             */
            $session->participants()->create([
                'user_id' =>
                    $user->id,

                'role' =>
                    'host',

                'status' =>
                    'accepted',

                'joined_at' =>
                    now(),
            ]);

            DB::commit();

            $session->load([
                'host:id,name',
                'subject:id,name',
                'studyGroup:id,name,slug',
                'participants.user:id,name',
            ]);

            $session->loadCount([
                'participants as participants_count' =>
                    function ($query) {
                        $query->where(
                            'status',
                            'accepted'
                        );
                    },
            ]);

            return response()->json([
                'message' =>
                    'Sesi belajar berhasil dibuat.',

                'data' =>
                    (new StudySessionResource($session))
                        ->resolve($request),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            report($e);

            return response()->json([
                'message' =>
                    'Gagal membuat sesi belajar.',
            ], 500);
        }
    }

    /**
     * Menampilkan detail satu sesi.
     *
     * Hanya anggota aktif dari grup
     * yang dapat melihat sesi.
     */
    public function show(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        $studySession->load([
            'studyGroup.members',
        ]);

        $isMember =
            $studySession->studyGroup
                ->members()
                ->where(
                    'user_id',
                    $user->id
                )
                ->where(
                    'status',
                    'accepted'
                )
                ->exists();

        if (!$isMember) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki akses ke sesi ini.',
            ], 403);
        }

        $studySession->load([
            'host:id,name',
            'subject:id,name',
            'studyGroup:id,name,slug',
            'participants.user:id,name',
        ]);

        $studySession->loadCount([
            'participants as participants_count' =>
                function ($query) {
                    $query->where(
                        'status',
                        'accepted'
                    );
                },
        ]);

        return response()->json([
            'message' =>
                'Detail sesi berhasil diambil.',

            'data' =>
                (new StudySessionResource($studySession))
                    ->resolve($request),
        ]);
    }

    /**
     * Mengubah sesi.
     *
     * Hanya host sesi yang boleh
     * melakukan perubahan.
     */
    public function update(
        UpdateStudySessionRequest $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        if (
            $studySession->host_id !==
            $user->id
        ) {
            return response()->json([
                'message' =>
                    'Hanya host yang dapat mengubah sesi.',
            ], 403);
        }

        if (
            $studySession->status !==
            'scheduled'
        ) {
            return response()->json([
                'message' =>
                    'Sesi yang sudah berjalan/selesai tidak dapat diubah.',
            ], 422);
        }

        $validated =
            $request->validated();

        /*
         * Kapasitas baru tidak boleh
         * lebih kecil daripada peserta aktif.
         */
        if (
            isset(
                $validated['max_participants']
            )
        ) {
            $participantCount =
                $studySession->participants()
                    ->where(
                        'status',
                        'accepted'
                    )
                    ->count();

            if (
                $validated['max_participants'] <
                $participantCount
            ) {
                return response()->json([
                    'message' =>
                        'Kapasitas baru tidak boleh lebih kecil dari jumlah peserta saat ini.',
                ], 422);
            }
        }

        /*
         * study_group_id dan subject_id
         * tidak diubah melalui update sesi.
         */
        unset(
            $validated['study_group_id'],
            $validated['subject_id']
        );

        $studySession->update(
            $validated
        );

        $studySession->refresh();

        $studySession->load([
            'host:id,name',
            'subject:id,name',
            'studyGroup:id,name,slug',
            'participants.user:id,name',
        ]);

        $studySession->loadCount([
            'participants as participants_count' =>
                function ($query) {
                    $query->where(
                        'status',
                        'accepted'
                    );
                },
        ]);

        return response()->json([
            'message' =>
                'Sesi berhasil diperbarui.',

            'data' =>
                (new StudySessionResource($studySession))
                    ->resolve($request),
        ]);
    }

    /**
     * Membatalkan sesi.
     *
     * Hanya host yang boleh
     * membatalkan sesi.
     */
    public function destroy(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        if (
            $studySession->host_id !==
            $user->id
        ) {
            return response()->json([
                'message' =>
                    'Hanya host yang dapat membatalkan sesi.',
            ], 403);
        }

        if (
            $studySession->status !==
            'scheduled'
        ) {
            return response()->json([
                'message' =>
                    'Sesi ini sudah tidak dapat dibatalkan.',
            ], 422);
        }

        $studySession->update([
            'status' =>
                'cancelled',
        ]);

        return response()->json([
            'message' =>
                'Sesi berhasil dibatalkan.',
        ]);
    }
}