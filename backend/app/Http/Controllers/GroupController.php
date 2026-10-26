<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesDomainExceptions;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupMemberStatusRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\StudyGroupResource;
use App\Models\GroupMember;
use App\Models\StudyGroup;
use App\Services\GroupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class GroupController extends Controller
{
    use HandlesDomainExceptions;

    public function __construct(
        private readonly GroupService $service
    ) {}

    /**
     * Menampilkan semua grup.
     */
    public function index(Request $request)
    {
        return response()->json([
            'data' => StudyGroupResource::collection($this->service->list())
                ->resolve($request),
        ]);
    }

    /**
     * Menampilkan detail grup.
     */
    public function show(Request $request, StudyGroup $group)
    {
        return response()->json([
            'data' => (new StudyGroupResource($this->service->detail($group)))
                ->resolve($request),
        ]);
    }

    /**
     * Membuat grup baru.
     */
    public function store(StoreGroupRequest $request)
    {
        return $this->handle(function () use ($request) {
            $group = $this->service->create($request->validated(), $request->user());

            return response()->json([
                'message' => 'Grup berhasil dibuat.',
                'data' => (new StudyGroupResource($group))->resolve($request),
            ], 201);
        });
    }

    /**
     * Memperbarui grup.
     */
    public function update(UpdateGroupRequest $request, StudyGroup $group)
    {
        return $this->handle(function () use ($request, $group) {
            $group = $this->service->update($group, $request->validated());

            return response()->json([
                'message' => 'Grup berhasil diperbarui.',
                'data' => (new StudyGroupResource($group))->resolve($request),
            ]);
        });
    }

    /**
     * Menghapus grup.
     */
    public function destroy(Request $request, StudyGroup $group)
    {
        Gate::authorize('delete', $group);

        return $this->handle(function () use ($group) {
            $this->service->delete($group);

            return response()->json([
                'message' => 'Grup berhasil dihapus.',
            ]);
        });
    }

    /**
     * Join / keluar / batalkan permintaan.
     */
    public function joinToggle(Request $request, StudyGroup $group)
    {
        return $this->handle(fn () => response()->json(
            $this->service->toggleMembership($group, $request->user())
        ));
    }

    /**
     * Approve / reject anggota.
     */
    public function updateMemberStatus(
        UpdateGroupMemberStatusRequest $request,
        StudyGroup $group,
        GroupMember $member
    ) {
        return $this->handle(function () use ($request, $group, $member) {
            $this->service->assertMemberBelongsToGroup($group, $member);

            Gate::authorize('manageMembers', $group);

            $member = $this->service->updateMemberStatus(
                $group,
                $member,
                $request->validated()['status']
            );

            return response()->json([
                'message' => $member->status === 'accepted'
                    ? 'Permintaan anggota berhasil diterima.'
                    : 'Permintaan anggota berhasil ditolak.',
                'data' => (new GroupMemberResource($member))->resolve($request),
            ]);
        });
    }
}
