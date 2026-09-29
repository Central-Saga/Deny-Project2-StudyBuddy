<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupMemberStatusRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\StudyGroupResource;
use App\Models\GroupMember;
use App\Models\StudyGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    /**
     * Menampilkan semua grup.
     */
    public function index(Request $request)
    {
        $groups = StudyGroup::query()
            ->with([
                'creator:id,name',
                'creator.profile:id,user_id,avatar_url',
                'subject:id,code,name',
                'members.user:id,name',
                'members.user.profile:id,user_id,avatar_url',
            ])
            ->latest()
            ->get();

        return response()->json(
            StudyGroupResource::collection($groups)
                ->resolve($request)
        );
    }

    /**
     * Menampilkan detail grup.
     */
    public function show(
        Request $request,
        StudyGroup $group
    ) {
        $group->load([
            'creator:id,name',
            'creator.profile:id,user_id,avatar_url',
            'subject:id,code,name',
            'members.user:id,name',
            'members.user.profile:id,user_id,avatar_url',
        ]);

        return response()->json(
            (new StudyGroupResource($group))
                ->resolve($request)
        );
    }

    /**
     * Membuat grup baru.
     */
    public function store(StoreGroupRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        $slug = $this->generateUniqueSlug(
            $validated['name']
        );

        DB::beginTransaction();

        try {
            $group = StudyGroup::create([
                'creator_id' => $user->id,
                'subject_id' => $validated['subject_id'],
                'name' => $validated['name'],
                'slug' => $slug,
                'description' =>
                    $validated['description'] ?? null,
                'max_members' =>
                    $validated['max_members'],
                'is_private' =>
                    $validated['is_private'] ?? false,
            ]);

            // Creator otomatis menjadi admin.
            $group->members()->create([
                'user_id' => $user->id,
                'role' => 'admin',
                'status' => 'accepted',
                'joined_at' => now(),
            ]);

            DB::commit();

            $group->load([
                'creator:id,name',
                'creator.profile:id,user_id,avatar_url',
                'subject:id,code,name',
                'members.user:id,name',
                'members.user.profile:id,user_id,avatar_url',
            ]);

            return response()->json(
                (new StudyGroupResource($group))
                    ->resolve($request),
                201
            );
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            report($e);

            return response()->json([
                'message' => 'Gagal membuat grup.',
            ], 500);
        }
    }

    /**
     * Memperbarui grup.
     */
    public function update(
        UpdateGroupRequest $request,
        StudyGroup $group
    ) {
        $user = $request->user();

        if (
            !$this->isGroupAdmin(
                $group,
                $user->id
            )
        ) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki izin untuk mengubah grup ini.',
            ], 403);
        }

        $validated = $request->validated();

        /*
         * Kapasitas tidak boleh lebih kecil
         * dari jumlah anggota aktif.
         */
        if (
            array_key_exists(
                'max_members',
                $validated
            )
        ) {
            $activeMembers = $group->members()
                ->where('status', 'accepted')
                ->count();

            if (
                $validated['max_members'] <
                $activeMembers
            ) {
                return response()->json([
                    'message' =>
                        "Kapasitas minimal saat ini adalah {$activeMembers} anggota.",
                ], 422);
            }
        }

        /*
         * Jika nama berubah,
         * slug juga diperbarui.
         */
        if (
            array_key_exists(
                'name',
                $validated
            ) &&
            $validated['name'] !== $group->name
        ) {
            $validated['slug'] =
                $this->generateUniqueSlug(
                    $validated['name'],
                    $group->id
                );
        }

        $group->update($validated);

        $group->load([
            'creator:id,name',
            'creator.profile:id,user_id,avatar_url',
            'subject:id,code,name',
            'members.user:id,name',
            'members.user.profile:id,user_id,avatar_url',
        ]);

        return response()->json([
            'message' =>
                'Grup berhasil diperbarui.',

            'data' =>
                (new StudyGroupResource($group))
                    ->resolve($request),
        ]);
    }

    /**
     * Menghapus grup.
     */
    public function destroy(
        Request $request,
        StudyGroup $group
    ) {
        $user = $request->user();

        if (
            !$this->isGroupAdmin(
                $group,
                $user->id
            )
        ) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki izin untuk menghapus grup ini.',
            ], 403);
        }

        try {
            $group->delete();

            return response()->json([
                'message' =>
                    'Grup berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' =>
                    'Gagal menghapus grup.',
            ], 500);
        }
    }

    /**
     * Join / keluar / batalkan permintaan.
     */
    public function joinToggle(
        Request $request,
        StudyGroup $group
    ) {
        $user = $request->user();
        $userId = $user->id;

        $membership = $group->members()
            ->where('user_id', $userId)
            ->first();

        /*
         * Sudah menjadi anggota aktif.
         */
        if (
            $membership &&
            $membership->status === 'accepted'
        ) {
            /*
             * Creator tidak boleh keluar
             * dari grupnya sendiri.
             */
            if (
                (int) $group->creator_id ===
                (int) $userId
            ) {
                return response()->json([
                    'message' =>
                        'Creator grup tidak dapat keluar dari grup. Transfer pengelolaan grup terlebih dahulu.',
                ], 422);
            }

            $membership->update([
                'status' => 'rejected',
                'joined_at' => null,
            ]);

            return response()->json([
                'message' =>
                    'Berhasil keluar dari grup.',
                'joined' => false,
                'status' => 'rejected',
            ]);
        }

        /*
         * Batalkan permintaan pending.
         */
        if (
            $membership &&
            $membership->status === 'pending'
        ) {
            $membership->update([
                'status' => 'rejected',
                'joined_at' => null,
            ]);

            return response()->json([
                'message' =>
                    'Permintaan bergabung berhasil dibatalkan.',
                'joined' => false,
                'status' => 'rejected',
            ]);
        }

        /*
         * Cek kapasitas grup.
         */
        $activeMembers = $group->members()
            ->where('status', 'accepted')
            ->count();

        if (
            $activeMembers >=
            $group->max_members
        ) {
            return response()->json([
                'message' =>
                    'Grup sudah penuh.',
            ], 422);
        }

        /*
         * Grup private:
         * status pending.
         *
         * Grup public:
         * langsung accepted.
         */
        $newStatus = $group->is_private
            ? 'pending'
            : 'accepted';

        if ($membership) {
            /*
             * User sebelumnya pernah keluar /
             * ditolak dan sekarang mencoba join lagi.
             */
            $membership->update([
                'role' => 'member',
                'status' => $newStatus,
                'joined_at' =>
                    $newStatus === 'accepted'
                        ? now()
                        : null,
            ]);

            $membership->refresh();
        } else {
            $membership = $group->members()
                ->create([
                    'user_id' => $userId,
                    'role' => 'member',
                    'status' => $newStatus,
                    'joined_at' =>
                        $newStatus === 'accepted'
                            ? now()
                            : null,
                ]);
        }

        /*
         * Jika grup private dan request menjadi
         * pending, kirim notifikasi kepada creator.
         */
        if ($newStatus === 'pending') {
            $requesterName = $user->name;

            $this->insertNotification(
                (int) $group->creator_id,
                'Permintaan bergabung baru',
                "{$requesterName} ingin bergabung ke grup {$group->name}.",
                [
                    'group_id' =>
                        (int) $group->id,

                    'group_name' =>
                        $group->name,

                    'member_id' =>
                        (int) $membership->id,

                    'requester_id' =>
                        (int) $userId,

                    'requester_name' =>
                        $requesterName,

                    'status' =>
                        'pending',
                ]
            );
        }

        return response()->json([
            'message' =>
                $group->is_private
                    ? 'Permintaan bergabung berhasil dikirim.'
                    : 'Berhasil bergabung ke grup.',

            'joined' =>
                $newStatus === 'accepted',

            'status' =>
                $newStatus,
        ]);
    }

    /**
     * Approve / reject anggota.
     */
    public function updateMemberStatus(
        UpdateGroupMemberStatusRequest $request,
        StudyGroup $group,
        GroupMember $member
    ) {
        $user = $request->user();

        /*
         * Pastikan member memang milik
         * grup yang sedang diproses.
         */
        if (
            (int) $member->study_group_id !==
            (int) $group->id
        ) {
            return response()->json([
                'message' =>
                    'Data anggota tidak ditemukan pada grup ini.',
            ], 404);
        }

        /*
         * Hanya creator / admin aktif
         * yang dapat approve / reject.
         */
        if (
            !$this->isGroupAdmin(
                $group,
                $user->id
            )
        ) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki izin untuk mengelola anggota grup.',
            ], 403);
        }

        /*
         * Hanya request pending
         * yang boleh diproses.
         */
        if ($member->status !== 'pending') {
            return response()->json([
                'message' =>
                    'Permintaan anggota ini sudah diproses.',
            ], 422);
        }

        $status =
            $request->validated()['status'];

        /*
         * Saat approve,
         * cek kapasitas lagi.
         */
        if ($status === 'accepted') {
            $activeMembers = $group->members()
                ->where('status', 'accepted')
                ->count();

            if (
                $activeMembers >=
                $group->max_members
            ) {
                return response()->json([
                    'message' =>
                        'Grup sudah penuh. Permintaan tidak dapat diterima.',
                ], 422);
            }
        }

        $member->update([
            'status' => $status,

            'joined_at' =>
                $status === 'accepted'
                    ? now()
                    : null,
        ]);

        /*
         * Kirim notifikasi kepada user
         * bahwa permintaan join telah
         * diterima atau ditolak.
         */
        $this->insertNotification(
            (int) $member->user_id,

            $status === 'accepted'
                ? 'Permintaan bergabung diterima'
                : 'Permintaan bergabung ditolak',

            $status === 'accepted'
                ? "Permintaan bergabung ke grup {$group->name} telah diterima."
                : "Permintaan bergabung ke grup {$group->name} telah ditolak.",

            [
                'group_id' =>
                    (int) $group->id,

                'group_name' =>
                    $group->name,

                'status' =>
                    $status,
            ]
        );

        $member->load([
            'user:id,name',
            'user.profile:id,user_id,avatar_url',
        ]);

        return response()->json([
            'message' =>
                $status === 'accepted'
                    ? 'Permintaan anggota berhasil diterima.'
                    : 'Permintaan anggota berhasil ditolak.',

            'data' =>
                (new GroupMemberResource($member))
                    ->resolve($request),
        ]);
    }

    /**
     * Membuat notifikasi in-app.
     *
     * Kegagalan notifikasi tidak boleh
     * menggagalkan proses utama grup.
     */
    private function insertNotification(
        int $userId,
        string $title,
        string $message,
        array $extra = []
    ): void {
        try {
            DB::table('notifications')->insert([
                'id' =>
                    (string) Str::uuid(),

                'type' =>
                    'group',

                'notifiable_type' =>
                    'App\\Models\\User',

                'notifiable_id' =>
                    $userId,

                'data' => json_encode(
                    array_merge([
                        'title' => $title,
                        'message' => $message,
                    ], $extra),
                    JSON_UNESCAPED_UNICODE
                ),

                'read_at' =>
                    null,

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Cek creator / admin aktif.
     */
    private function isGroupAdmin(
        StudyGroup $group,
        int $userId
    ): bool {
        /*
         * Creator selalu dianggap admin.
         */
        if (
            (int) $group->creator_id ===
            (int) $userId
        ) {
            return true;
        }

        /*
         * Selain creator, cek member
         * dengan role admin dan accepted.
         */
        return $group->members()
            ->where(
                'user_id',
                $userId
            )
            ->where(
                'role',
                'admin'
            )
            ->where(
                'status',
                'accepted'
            )
            ->exists();
    }

    /**
     * Membuat slug unik.
     */
    private function generateUniqueSlug(
        string $name,
        ?int $ignoreGroupId = null
    ): string {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug =
                'study-group';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (
            StudyGroup::query()
                ->when(
                    $ignoreGroupId,
                    fn ($query) =>
                        $query->where(
                            'id',
                            '!=',
                            $ignoreGroupId
                        )
                )
                ->where(
                    'slug',
                    $slug
                )
                ->exists()
        ) {
            $slug =
                $baseSlug .
                '-' .
                $counter;

            $counter++;
        }

        return $slug;
    }
}