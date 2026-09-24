<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();

        $validated = $request->validated();

        $user->update($validated);

        $user->load('profile');

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => (new UserResource($user))
                ->resolve($request),
        ]);
    }
}