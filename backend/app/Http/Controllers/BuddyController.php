<?php

namespace App\Http\Controllers;

use App\Models\BuddyConnection;
use App\Models\User;
use Illuminate\Http\Request;

class BuddyController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Jangan tampilkan user yang sedang login
        if ($request->user()) {
            $query->where('id', '!=', $request->user()->id);
        }

        // Search berdasarkan nama atau course
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('course', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan mata kuliah
        if ($request->has('course') && $request->course != 'Semua') {
            $query->where('course', $request->course);
        }

        $buddies = $query->get();

        // Tambahkan status connection untuk setiap buddy
        if ($request->user()) {
            $currentUserId = $request->user()->id;

            $connections = BuddyConnection::query()
                ->where(function ($q) use ($currentUserId) {
                    $q->where('requester_id', $currentUserId)
                        ->orWhere('receiver_id', $currentUserId);
                })
                ->whereIn('status', ['pending', 'accepted'])
                ->get(['requester_id', 'receiver_id']);

            $connectedBuddyIds = $connections->map(function ($connection) use ($currentUserId) {
                return $connection->requester_id == $currentUserId
                    ? $connection->receiver_id
                    : $connection->requester_id;
            })->unique();

            $buddies->each(function ($buddy) use ($connectedBuddyIds) {
                $buddy->setAttribute(
                    'is_connected',
                    $connectedBuddyIds->contains($buddy->id)
                );
            });
        }

        return response()->json($buddies);
    }

    public function connect(Request $request, int $id)
    {
        $currentUserId = $request->user()->id;

        // Cari user yang ingin di-connect
        $buddy = User::findOrFail($id);

        // Tidak boleh connect ke diri sendiri
        if ($currentUserId === $buddy->id) {
            return response()->json([
                'message' => 'Tidak dapat melakukan connect ke diri sendiri.',
            ], 422);
        }

        // Cek apakah hubungan/request sudah pernah ada
        // baik current user -> buddy maupun buddy -> current user
        $existingConnection = BuddyConnection::query()
            ->where(function ($query) use ($currentUserId, $buddy) {
                $query->where('requester_id', $currentUserId)
                    ->where('receiver_id', $buddy->id);
            })
            ->orWhere(function ($query) use ($currentUserId, $buddy) {
                $query->where('requester_id', $buddy->id)
                    ->where('receiver_id', $currentUserId);
            })
            ->first();

        if ($existingConnection) {
            return response()->json([
                'message' => 'Request connection sudah pernah dibuat.',
                'status' => $existingConnection->status,
            ], 409);
        }

        // Buat request connection baru
        $connection = BuddyConnection::create([
            'requester_id' => $currentUserId,
            'receiver_id' => $buddy->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan koneksi berhasil dikirim.',
            'data' => $connection->load([
                'requester:id,name,email',
                'receiver:id,name,email',
            ]),
        ], 201);
    }
}