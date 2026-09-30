<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Menampilkan seluruh user biasa.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    User::STATUS_ACTIVE,
                    User::STATUS_SUSPENDED,
                ]),
            ],
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $users = User::query()
            ->where('role', User::ROLE_USER)
            ->with([
                'profile',
                'userSubjects.subject',
                'availabilities',
            ])
            ->when(
                isset($validated['status']),
                fn ($query) =>
                    $query->where(
                        'account_status',
                        $validated['status']
                    )
            )
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
                                'email',
                                'like',
                                "%{$search}%"
                            );
                    });
                }
            )
            ->latest()
            ->get();

        return response()->json([
            'message' =>
                'Daftar user berhasil diambil.',
            'data' =>
                UserResource::collection($users)
                    ->resolve($request),
        ]);
    }

    /**
     * Menampilkan detail user.
     */
    public function show(
        Request $request,
        User $user
    ): JsonResponse {
        if ($user->role !== User::ROLE_USER) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' =>
                'Detail user berhasil diambil.',
            'data' =>
                (new UserResource($user))
                    ->resolve($request),
        ]);
    }

    /**
     * Mengubah status akun user.
     */
    public function updateStatus(
        Request $request,
        User $user
    ): JsonResponse {
        if ($user->role !== User::ROLE_USER) {
            return response()->json([
                'message' =>
                    'Status akun administrator tidak dapat diubah melalui endpoint ini.',
            ], 403);
        }

        $validated = $request->validate([
            'account_status' => [
                'required',
                Rule::in([
                    User::STATUS_ACTIVE,
                    User::STATUS_SUSPENDED,
                ]),
            ],
        ]);

        $user->account_status =
            $validated['account_status'];

        $user->save();

        /*
         * Jika akun disuspend, hapus seluruh token.
         * User harus login ulang setelah diaktifkan.
         */
        if (
            $user->account_status ===
            User::STATUS_SUSPENDED
        ) {
            $user->tokens()->delete();
        }

        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' =>
                $user->account_status === User::STATUS_ACTIVE
                    ? 'Akun user berhasil diaktifkan.'
                    : 'Akun user berhasil ditangguhkan.',

            'data' =>
                (new UserResource($user))
                    ->resolve($request),
        ]);
    }
}