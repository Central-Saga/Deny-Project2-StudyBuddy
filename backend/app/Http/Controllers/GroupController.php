<?php

namespace App\Http\Controllers;

use App\Models\StudyGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    /**
     * Menampilkan semua study group aktif.
     */
    public function index()
    {
        $groups = StudyGroup::with([
            'creator:id,name',
            'subject:id,name',
            'members.user:id,name',
        ])
        ->whereNull('deleted_at')
        ->latest()
        ->get();

        return response()->json($groups);
    }

    /**
     * Membuat study group baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'description' => 'nullable|string',
            'max_members' => 'required|integer|min:2|max:100',
            'is_private' => 'boolean',
        ]);

        $user = $request->user();

        $slug = Str::slug($validated['name']);

        // Pastikan slug unik
        $originalSlug = $slug;
        $counter = 1;

        while (StudyGroup::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        DB::beginTransaction();

        try {
            $group = StudyGroup::create([
                'creator_id' => $user->id,
                'subject_id' => $validated['subject_id'],
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'max_members' => $validated['max_members'],
                'is_private' => $validated['is_private'] ?? false,
            ]);

            // Creator otomatis menjadi admin dan anggota aktif
            DB::table('group_members')->insert([
                'study_group_id' => $group->id,
                'user_id' => $user->id,
                'role' => 'admin',
                'status' => 'accepted',
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json(
                $group->load([
                    'creator:id,name',
                    'subject:id,name',
                    'members.user:id,name',
                ]),
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal membuat grup.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Join / keluar dari study group.
     */
    public function joinToggle(Request $request, $id)
    {
        $group = StudyGroup::findOrFail($id);

        $userId = $request->user()->id;

        $membership = DB::table('group_members')
            ->where('study_group_id', $group->id)
            ->where('user_id', $userId)
            ->first();

        /*
         * Jika user sudah menjadi anggota aktif:
         * user keluar dari grup.
         */
        if ($membership && $membership->status === 'accepted') {

            // Creator/admin utama tidak boleh keluar sembarangan.
            if (
                $membership->role === 'admin' &&
                $group->creator_id === $userId
            ) {
                return response()->json([
                    'message' => 'Creator grup tidak dapat keluar dari grup. Transfer pengelolaan grup terlebih dahulu.'
                ], 422);
            }

            DB::table('group_members')
                ->where('id', $membership->id)
                ->update([
                    'status' => 'rejected',
                    'updated_at' => now(),
                ]);

            return response()->json([
                'message' => 'Berhasil keluar dari grup.',
                'joined' => false,
            ]);
        }

        /*
         * Cek kapasitas anggota aktif.
         */
        $activeMembers = DB::table('group_members')
            ->where('study_group_id', $group->id)
            ->where('status', 'accepted')
            ->count();

        if ($activeMembers >= $group->max_members) {
            return response()->json([
                'message' => 'Grup sudah penuh.',
            ], 422);
        }

        /*
         * Jika sebelumnya pernah rejected,
         * aktifkan kembali membership tersebut.
         */
        if ($membership) {
            DB::table('group_members')
                ->where('id', $membership->id)
                ->update([
                    'status' => $group->is_private ? 'pending' : 'accepted',
                    'joined_at' => $group->is_private ? null : now(),
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('group_members')->insert([
                'study_group_id' => $group->id,
                'user_id' => $userId,
                'role' => 'member',
                'status' => $group->is_private ? 'pending' : 'accepted',
                'joined_at' => $group->is_private ? null : now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => $group->is_private
                ? 'Permintaan bergabung berhasil dikirim.'
                : 'Berhasil bergabung ke grup.',
            'joined' => !$group->is_private,
            'status' => $group->is_private ? 'pending' : 'accepted',
        ]);
    }
}