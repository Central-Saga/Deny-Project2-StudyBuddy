<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $baseQuery = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id);

        // Hitung semua notifikasi yang belum dibaca.
        // Tidak dibatasi hanya 50 data terbaru.
        $unreadCount = (clone $baseQuery)
            ->whereNull('read_at')
            ->count();

        // Daftar notifikasi tetap dibatasi 50 terbaru.
        $rows = (clone $baseQuery)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $data = $rows->map(function ($notification) {
            $payload = json_decode(
                $notification->data,
                true
            );

            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'data' => is_array($payload)
                    ? $payload
                    : [
                        'message' =>
                            (string) $notification->data,
                    ],
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ];
        })->values();

        return response()->json([
            'notifications' => $data,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markRead(
        string $id,
        Request $request
    ) {
        $updated = DB::table('notifications')
            ->where('id', $id)
            ->where(
                'notifiable_type',
                User::class
            )
            ->where(
                'notifiable_id',
                $request->user()->id
            )
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json([
                'message' =>
                    'Notifikasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' =>
                'Notifikasi ditandai sudah dibaca.',
        ]);
    }

    public function markAllRead(
        Request $request
    ) {
        DB::table('notifications')
            ->where(
                'notifiable_type',
                User::class
            )
            ->where(
                'notifiable_id',
                $request->user()->id
            )
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' =>
                'Semua notifikasi sudah dibaca.',
        ]);
    }
}