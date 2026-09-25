<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        /*
         * Field yang memang masih berada pada tabel users.
         */
        $userFields = array_intersect_key(
            $validated,
            array_flip([
                'name',
                'course',
                'skills',
            ])
        );

        /*
         * Sinkronkan bio lama pada users untuk sementara
         * agar fitur lama yang masih membaca users.bio
         * tidak langsung rusak.
         *
         * Sumber utama bio setelah audit ini adalah profiles.bio.
         */
        if (array_key_exists('bio', $validated)) {
            $userFields['bio'] = $validated['bio'];
        }

        if (!empty($userFields)) {
            $user->update($userFields);
        }

        /*
         * Data profil disimpan di tabel profiles.
         */
        $profile = $user->profile()->firstOrCreate([]);

        $profileFields = array_intersect_key(
            $validated,
            array_flip([
                'bio',
                'phone_number',
                'university',
                'major',
                'github_url',
                'linkedin_url',
            ])
        );

        if (!empty($profileFields)) {
            $profile->update($profileFields);
        }

        $user->load('profile');

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => (new UserResource($user))
                ->resolve($request),
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $validated = $request->validate([
            'avatar' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $user = $request->user();

        $profile = $user->profile()->firstOrCreate([]);

        /*
         * Hapus foto lama jika foto tersebut memang
         * merupakan file yang disimpan di storage lokal.
         */
        if (
            $profile->avatar_url &&
            !str_starts_with($profile->avatar_url, 'http://') &&
            !str_starts_with($profile->avatar_url, 'https://') &&
            Storage::disk('public')->exists($profile->avatar_url)
        ) {
            Storage::disk('public')->delete($profile->avatar_url);
        }

        $path = $validated['avatar']->store(
            'avatars',
            'public'
        );

        $profile->update([
            'avatar_url' => $path,
        ]);

        $user->load('profile');

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui.',
            'user' => (new UserResource($user))
                ->resolve($request),
        ]);
    }
}