<?php

namespace App\Http\Controllers;

use App\Models\StudySession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionParticipantController extends Controller
{
    /**
     * Join ke sesi.
     */
    public function join(Request $request, StudySession $studySession)
    {
        $user = $request->user();

        // Load relasi yang digunakan agar tidak terjadi lazy loading.
        $studySession->load('studyGroup');

        if ($studySession->status !== 'scheduled') {
            return response()->json([
                'message' => 'Sesi sudah tidak dapat diikuti.',
            ], 422);
        }

        // Pastikan user anggota aktif group.
        $isGroupMember = $studySession->studyGroup
            ->members()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();

        if (!$isGroupMember) {
            return response()->json([
                'message' => 'Anda harus menjadi anggota aktif grup terlebih dahulu.',
            ], 403);
        }

        // Cek apakah sudah menjadi peserta aktif.
        $existing = $studySession->participants()
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status === 'accepted') {
            return response()->json([
                'message' => 'Anda sudah terdaftar sebagai peserta sesi.',
            ], 422);
        }

        // Cek kapasitas.
        $participantCount = $studySession->participants()
            ->where('status', 'accepted')
            ->count();

        if ($participantCount >= $studySession->max_participants) {
            return response()->json([
                'message' => 'Sesi sudah penuh.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            if ($existing) {
                $existing->update([
                    'role' => 'participant',
                    'status' => 'accepted',
                    'joined_at' => now(),
                ]);
            } else {
                $studySession->participants()->create([
                    'user_id' => $user->id,
                    'role' => 'participant',
                    'status' => 'accepted',
                    'joined_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Berhasil bergabung ke sesi.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal bergabung ke sesi.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Keluar dari sesi.
     */
    public function leave(Request $request, StudySession $studySession)
    {
        $user = $request->user();

        $participant = $studySession->participants()
            ->where('user_id', $user->id)
            ->first();

        if (!$participant || $participant->status !== 'accepted') {
            return response()->json([
                'message' => 'Anda bukan peserta aktif sesi ini.',
            ], 422);
        }

        // Host tidak boleh meninggalkan session.
        if (
            $studySession->host_id === $user->id ||
            $participant->role === 'host'
        ) {
            return response()->json([
                'message' => 'Host tidak dapat keluar dari sesi. Batalkan sesi jika sudah tidak digunakan.',
            ], 422);
        }

        $participant->update([
            'status' => 'left',
        ]);

        return response()->json([
            'message' => 'Berhasil keluar dari sesi.',
        ]);
    }
}