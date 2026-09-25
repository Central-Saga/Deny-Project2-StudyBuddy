<?php

namespace App\Http\Controllers;

use App\Models\StudySession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionParticipantController extends Controller
{
    /**
     * Join ke sesi belajar.
     */
    public function join(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        try {
            $result = DB::transaction(function () use (
                $studySession,
                $user
            ) {
                /*
                 * Lock session agar pengecekan kapasitas
                 * tidak bentrok jika beberapa user join
                 * secara bersamaan.
                 */
                $session = StudySession::query()
                    ->with('studyGroup')
                    ->lockForUpdate()
                    ->findOrFail($studySession->id);

                if ($session->status !== 'scheduled') {
                    return [
                        'status' => 422,
                        'message' =>
                            'Sesi sudah tidak dapat diikuti.',
                    ];
                }

                /*
                 * User wajib menjadi anggota grup
                 * dengan status accepted.
                 */
                $isGroupMember = $session->studyGroup
                    ->members()
                    ->where('user_id', $user->id)
                    ->where('status', 'accepted')
                    ->exists();

                if (!$isGroupMember) {
                    return [
                        'status' => 403,
                        'message' =>
                            'Anda harus menjadi anggota aktif grup terlebih dahulu.',
                    ];
                }

                /*
                 * Cari riwayat participant.
                 */
                $existing = $session->participants()
                    ->where('user_id', $user->id)
                    ->first();

                if (
                    $existing &&
                    $existing->status === 'accepted'
                ) {
                    return [
                        'status' => 422,
                        'message' =>
                            'Anda sudah terdaftar sebagai peserta sesi.',
                    ];
                }

                /*
                 * Cek kapasitas peserta aktif.
                 */
                $participantCount = $session
                    ->participants()
                    ->where('status', 'accepted')
                    ->count();

                if (
                    $participantCount >=
                    $session->max_participants
                ) {
                    return [
                        'status' => 422,
                        'message' =>
                            'Sesi sudah penuh.',
                    ];
                }

                /*
                 * Jika sebelumnya pernah keluar,
                 * aktifkan kembali.
                 */
                if ($existing) {
                    $existing->update([
                        'role' => 'participant',
                        'status' => 'accepted',
                        'joined_at' => now(),
                    ]);
                } else {
                    $session->participants()->create([
                        'user_id' => $user->id,
                        'role' => 'participant',
                        'status' => 'accepted',
                        'joined_at' => now(),
                    ]);
                }

                return [
                    'status' => 200,
                    'message' =>
                        'Berhasil bergabung ke sesi.',
                ];
            });

            return response()->json([
                'message' => $result['message'],
            ], $result['status']);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' =>
                    'Gagal bergabung ke sesi.',
            ], 500);
        }
    }

    /**
     * Keluar dari sesi belajar.
     */
    public function leave(
        Request $request,
        StudySession $studySession
    ) {
        $user = $request->user();

        $participant = $studySession
            ->participants()
            ->where('user_id', $user->id)
            ->first();

        if (
            !$participant ||
            $participant->status !== 'accepted'
        ) {
            return response()->json([
                'message' =>
                    'Anda bukan peserta aktif sesi ini.',
            ], 422);
        }

        /*
         * Host / ketua pembuat sesi
         * tidak boleh meninggalkan sesi.
         */
        if (
            $studySession->host_id === $user->id ||
            $participant->role === 'host'
        ) {
            return response()->json([
                'message' =>
                    'Host tidak dapat keluar dari sesi. Batalkan sesi jika sudah tidak digunakan.',
            ], 422);
        }

        try {
            $participant->update([
                'status' => 'left',
                'joined_at' => null,
            ]);

            return response()->json([
                'message' =>
                    'Berhasil keluar dari sesi.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' =>
                    'Gagal keluar dari sesi.',
            ], 500);
        }
    }
}