<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(
        RegisterRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(
                $validated['password']
            ),
            'last_active_at' => now(),
        ]);

        // Buat profil kosong default
        Profile::create([
            'user_id' => $user->id,
        ]);

        $token = $user
            ->createToken('auth_token')
            ->plainTextToken;

        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' => 'Registrasi berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(
        LoginRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        $user = User::where(
            'email',
            $validated['email']
        )->first();

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'Kredensial yang diberikan tidak cocok dengan catatan kami.',
                ],
            ]);
        }

        /*
         * Update aktivitas terakhir.
         * Digunakan sebagai tie-breaker
         * pada pencarian Study Buddy.
         */
        $user->update([
            'last_active_at' => now(),
        ]);

        $token = $user
            ->createToken('auth_token')
            ->plainTextToken;

        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    public function me(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        /*
         * Load seluruh data yang diperlukan
         * halaman Profile dan Find Buddy.
         */
        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function logout(
        Request $request
    ): JsonResponse {
        $request
            ->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message' => 'Berhasil logout',
        ]);
    }
}