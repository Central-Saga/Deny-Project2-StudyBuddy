<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGroupController extends Controller
{
    /**
     * Menampilkan seluruh study group untuk monitoring admin.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'privacy' => [
                'nullable',
                'in:public,private',
            ],
        ]);

        $groups = StudyGroup::query()
            ->with([
                'creator:id,name,email',
                'subject:id,code,name',
            ])
            ->withCount([
                'members as accepted_members_count' =>
                    fn ($query) =>
                        $query->where('status', 'accepted'),

                'members as pending_members_count' =>
                    fn ($query) =>
                        $query->where('status', 'pending'),

                'members as rejected_members_count' =>
                    fn ($query) =>
                        $query->where('status', 'rejected'),

                'members as group_admins_count' =>
                    fn ($query) =>
                        $query
                            ->where('role', 'admin')
                            ->where('status', 'accepted'),

                'sessions',
            ])
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'description',
                                'like',
                                "%{$search}%"
                            );
                    });
                }
            )
            ->when(
                isset($validated['privacy']),
                function ($query) use ($validated) {
                    $query->where(
                        'is_private',
                        $validated['privacy'] === 'private'
                    );
                }
            )
            ->latest()
            ->get();

        $data = $groups->map(function (StudyGroup $group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'slug' => $group->slug,
                'description' => $group->description,

                'max_members' => $group->max_members,

                'is_private' =>
                    (bool) $group->is_private,

                'privacy' =>
                    $group->is_private
                        ? 'private'
                        : 'public',

                'creator' => $group->creator
                    ? [
                        'id' => $group->creator->id,
                        'name' => $group->creator->name,
                        'email' => $group->creator->email,
                    ]
                    : null,

                'subject' => $group->subject
                    ? [
                        'id' => $group->subject->id,
                        'code' => $group->subject->code,
                        'name' => $group->subject->name,
                    ]
                    : null,

                'member_stats' => [
                    'accepted' =>
                        (int) $group->accepted_members_count,

                    'pending' =>
                        (int) $group->pending_members_count,

                    'rejected' =>
                        (int) $group->rejected_members_count,

                    'group_admins' =>
                        (int) $group->group_admins_count,
                ],

                'sessions_count' =>
                    (int) $group->sessions_count,

                'created_at' =>
                    $group->created_at?->toIso8601String(),

                'updated_at' =>
                    $group->updated_at?->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'message' =>
                'Daftar study group berhasil diambil.',
            'data' => $data,
        ]);
    }

    /**
     * Menampilkan detail study group untuk monitoring admin.
     */
    public function show(
        StudyGroup $group
    ): JsonResponse {
        $group->load([
            'creator:id,name,email',
            'subject:id,code,name',

            'members' => function ($query) {
                $query
                    ->with('user:id,name,email')
                    ->orderBy('role')
                    ->orderBy('status')
                    ->orderBy('created_at');
            },

            'sessions' => function ($query) {
                $query
                    ->select([
                        'id',
                        'study_group_id',
                        'host_id',
                        'title',
                        'scheduled_at',
                        'created_at',
                    ])
                    ->latest('scheduled_at');
            },
        ]);

        $members = $group->members
            ->map(function ($member) {
                return [
                    'id' => $member->id,

                    'user' => $member->user
                        ? [
                            'id' => $member->user->id,
                            'name' => $member->user->name,
                            'email' => $member->user->email,
                        ]
                        : null,

                    /*
                     * Ini adalah role di dalam group,
                     * bukan role admin sistem.
                     */
                    'role' => $member->role,

                    'status' => $member->status,

                    'joined_at' =>
                        $member->joined_at
                            ?->toIso8601String(),
                ];
            })
            ->values();

        $sessions = $group->sessions
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'host_id' => $session->host_id,
                    'title' => $session->title,
                    'scheduled_at' =>
                        $session->scheduled_at,
                    'created_at' =>
                        $session->created_at
                            ?->toIso8601String(),
                ];
            })
            ->values();

        return response()->json([
            'message' =>
                'Detail study group berhasil diambil.',

            'data' => [
                'id' => $group->id,
                'name' => $group->name,
                'slug' => $group->slug,
                'description' => $group->description,

                'max_members' =>
                    $group->max_members,

                'is_private' =>
                    (bool) $group->is_private,

                'privacy' =>
                    $group->is_private
                        ? 'private'
                        : 'public',

                'creator' => $group->creator
                    ? [
                        'id' => $group->creator->id,
                        'name' => $group->creator->name,
                        'email' => $group->creator->email,
                    ]
                    : null,

                'subject' => $group->subject
                    ? [
                        'id' => $group->subject->id,
                        'code' => $group->subject->code,
                        'name' => $group->subject->name,
                    ]
                    : null,

                'member_stats' => [
                    'accepted' =>
                        $group->members
                            ->where('status', 'accepted')
                            ->count(),

                    'pending' =>
                        $group->members
                            ->where('status', 'pending')
                            ->count(),

                    'rejected' =>
                        $group->members
                            ->where('status', 'rejected')
                            ->count(),

                    'group_admins' =>
                        $group->members
                            ->where('status', 'accepted')
                            ->where('role', 'admin')
                            ->count(),
                ],

                'members' => $members,
                'sessions' => $sessions,

                'created_at' =>
                    $group->created_at
                        ?->toIso8601String(),

                'updated_at' =>
                    $group->updated_at
                        ?->toIso8601String(),
            ],
        ]);
    }
}