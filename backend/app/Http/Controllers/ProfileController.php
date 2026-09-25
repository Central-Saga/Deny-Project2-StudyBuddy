<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated) {
            $userData = [];

            foreach (
                ['name', 'course', 'skills', 'learning_styles', 'bio']
                as $field
            ) {
                if (array_key_exists($field, $validated)) {
                    $userData[$field] = $validated[$field];
                }
            }

            $userData['last_active_at'] = now();
            $user->update($userData);

            $profileData = [];

            foreach (
                [
                    'phone_number',
                    'university',
                    'major',
                    'github_url',
                    'linkedin_url',
                ] as $field
            ) {
                if (array_key_exists($field, $validated)) {
                    $profileData[$field] = $validated[$field];
                }
            }

            if (array_key_exists('bio', $validated)) {
                $profileData['bio'] = $validated['bio'];
            }

            if (!empty($profileData)) {
                $user->profile()->updateOrCreate([], $profileData);
            }

            if (array_key_exists('subject_ids', $validated)) {
                $subjectIds = collect($validated['subject_ids'] ?? [])
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values();

                if ($subjectIds->isEmpty()) {
                    $user->userSubjects()
                        ->where('type', 'learning')
                        ->delete();
                } else {
                    $user->userSubjects()
                        ->where('type', 'learning')
                        ->whereNotIn('subject_id', $subjectIds->all())
                        ->delete();

                    foreach ($subjectIds as $subjectId) {
                        $user->userSubjects()->firstOrCreate(
                            [
                                'subject_id' => $subjectId,
                                'type' => 'learning',
                            ],
                            [
                                'proficiency_level' => 'beginner',
                            ]
                        );
                    }
                }
            }

            if (array_key_exists('availabilities', $validated)) {
                $user->availabilities()->delete();

                foreach ($validated['availabilities'] ?? [] as $availability) {
                    $user->availabilities()->create([
                        'day_of_week' => $availability['day_of_week'],
                        'start_time' => $availability['start_time'],
                        'end_time' => $availability['end_time'],
                        'timezone' => $availability['timezone'] ?? 'Asia/Jakarta',
                        'is_recurring' => $availability['is_recurring'] ?? true,
                    ]);
                }
            }
        });

        $user->refresh();
        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $user = $request->user();
        $oldPath = $user->profile?->avatar_url;
        $newPath = null;

        try {
            $newPath = $request->file('avatar')->store('avatars', 'public');

            $user->profile()->updateOrCreate(
                [],
                ['avatar_url' => $newPath]
            );

            if (
                $oldPath &&
                $oldPath !== $newPath &&
                !str_starts_with($oldPath, 'http://') &&
                !str_starts_with($oldPath, 'https://') &&
                Storage::disk('public')->exists($oldPath)
            ) {
                Storage::disk('public')->delete($oldPath);
            }
        } catch (\Throwable $e) {
            if (
                $newPath &&
                Storage::disk('public')->exists($newPath)
            ) {
                Storage::disk('public')->delete($newPath);
            }

            throw $e;
        }

        $user->refresh();
        $user->load([
            'profile',
            'userSubjects.subject',
            'availabilities',
        ]);

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui.',
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }
}
