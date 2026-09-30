<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminTutorController extends Controller
{
    /**
     * Daftar seluruh tutor.
     */
    public function index(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'verification' => [
                'nullable',
                Rule::in([
                    'verified',
                    'unverified',
                ]),
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],
        ]);

        $query = DB::table(
            'tutor_profiles as tp'
        )
            ->join(
                'users as u',
                'u.id',
                '=',
                'tp.user_id'
            )
            ->leftJoin(
                'profiles as p',
                'p.user_id',
                '=',
                'u.id'
            )
            ->leftJoin(
                'users as verifier',
                'verifier.id',
                '=',
                'tp.verified_by'
            );

        if (
            !empty(
                $validated['search']
            )
        ) {
            $search = strtolower(
                trim(
                    $validated['search']
                )
            );

            $query->where(
                function ($query) use (
                    $search
                ) {
                    $like = "%{$search}%";

                    $query
                        ->whereRaw(
                            'LOWER(u.name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(u.email) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(COALESCE(p.university, \'\')) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(COALESCE(p.major, \'\')) LIKE ?',
                            [$like]
                        );
                }
            );
        }

        if (
            isset(
                $validated[
                    'verification'
                ]
            )
        ) {
            $query->where(
                'tp.is_verified',
                $validated[
                    'verification'
                ] === 'verified'
            );
        }

        if (
            isset(
                $validated['status']
            )
        ) {
            $query->where(
                'tp.status',
                $validated['status']
            );
        }

        $profiles = $query
            ->orderByDesc(
                'tp.created_at'
            )
            ->select([
                'tp.id',
                'tp.user_id',
                'tp.bio',
                'tp.hourly_rate',
                'tp.is_verified',
                'tp.status',
                'tp.rating_avg',
                'tp.reviews_count',
                'tp.format_online',
                'tp.format_offline',
                'tp.verified_by',
                'tp.verified_at',
                'tp.created_at',
                'tp.updated_at',

                'u.name',
                'u.email',
                'u.account_status',

                'p.avatar_url',
                'p.university',
                'p.major',

                'verifier.name as verifier_name',
            ])
            ->get();

        $profileIds = $profiles
            ->pluck('id');

        $subjects = DB::table(
            'tutor_subjects as ts'
        )
            ->join(
                'subjects as s',
                's.id',
                '=',
                'ts.subject_id'
            )
            ->whereIn(
                'ts.tutor_profile_id',
                $profileIds
            )
            ->select([
                'ts.tutor_profile_id',
                's.id',
                's.name',
                's.code',
                'ts.proficiency_level',
            ])
            ->get()
            ->groupBy(
                'tutor_profile_id'
            );

        $data = $profiles->map(
            function (
                $profile
            ) use (
                $subjects
            ) {
                return [
                    'id' =>
                        $profile->id,

                    'user_id' =>
                        $profile->user_id,

                    'name' =>
                        $profile->name,

                    'email' =>
                        $profile->email,

                    'bio' =>
                        $profile->bio,

                    'hourly_rate' =>
                        (float)
                        $profile->hourly_rate,

                    'is_verified' =>
                        (bool)
                        $profile->is_verified,

                    'status' =>
                        $profile->status,

                    'account_status' =>
                        $profile->account_status,

                    'rating_avg' =>
                        (float)
                        $profile->rating_avg,

                    'reviews_count' =>
                        (int)
                        $profile->reviews_count,

                    'format_online' =>
                        (bool)
                        $profile->format_online,

                    'format_offline' =>
                        (bool)
                        $profile->format_offline,

                    'avatar_url' =>
                        $profile->avatar_url,

                    'university' =>
                        $profile->university,

                    'major' =>
                        $profile->major,

                    'verified_by' =>
                        $profile->verified_by,

                    'verified_at' =>
                        $profile->verified_at,

                    'verifier_name' =>
                        $profile->verifier_name,

                    'created_at' =>
                        $profile->created_at,

                    'subjects' =>
                        $subjects
                            ->get(
                                $profile->id,
                                collect()
                            )
                            ->values(),
                ];
            }
        )->values();

        return response()->json([
            'message' =>
                'Daftar tutor berhasil diambil.',

            'data' => $data,
        ]);
    }

    /**
     * Detail tutor.
     */
    public function show(
        TutorProfile $tutorProfile
    ): JsonResponse {
        $profile = DB::table(
            'tutor_profiles as tp'
        )
            ->join(
                'users as u',
                'u.id',
                '=',
                'tp.user_id'
            )
            ->leftJoin(
                'profiles as p',
                'p.user_id',
                '=',
                'u.id'
            )
            ->leftJoin(
                'users as verifier',
                'verifier.id',
                '=',
                'tp.verified_by'
            )
            ->where(
                'tp.id',
                $tutorProfile->id
            )
            ->select([
                'tp.*',

                'u.name',
                'u.email',
                'u.account_status',
                'u.last_active_at',

                'p.avatar_url',
                'p.phone_number',
                'p.university',
                'p.major',
                'p.github_url',
                'p.linkedin_url',

                'verifier.name as verifier_name',
                'verifier.email as verifier_email',
            ])
            ->first();

        if (!$profile) {
            return response()->json([
                'message' =>
                    'Tutor tidak ditemukan.',
            ], 404);
        }

        $subjects = DB::table(
            'tutor_subjects as ts'
        )
            ->join(
                'subjects as s',
                's.id',
                '=',
                'ts.subject_id'
            )
            ->where(
                'ts.tutor_profile_id',
                $profile->id
            )
            ->select([
                's.id',
                's.name',
                's.code',
                'ts.proficiency_level',
            ])
            ->get();

        $availability = DB::table(
            'tutor_availabilities'
        )
            ->where(
                'tutor_profile_id',
                $profile->id
            )
            ->orderBy(
                'day_of_week'
            )
            ->orderBy(
                'start_time'
            )
            ->get();

        $requestSummary = DB::table(
            'tutoring_requests'
        )
            ->where(
                'tutor_profile_id',
                $profile->id
            )
            ->selectRaw(
                'status, COUNT(*) as total'
            )
            ->groupBy('status')
            ->pluck(
                'total',
                'status'
            );

        return response()->json([
            'message' =>
                'Detail tutor berhasil diambil.',

            'data' => [
                'id' =>
                    $profile->id,

                'user_id' =>
                    $profile->user_id,

                'name' =>
                    $profile->name,

                'email' =>
                    $profile->email,

                'bio' =>
                    $profile->bio,

                'hourly_rate' =>
                    (float)
                    $profile->hourly_rate,

                'is_verified' =>
                    (bool)
                    $profile->is_verified,

                'status' =>
                    $profile->status,

                'account_status' =>
                    $profile->account_status,

                'rating_avg' =>
                    (float)
                    $profile->rating_avg,

                'reviews_count' =>
                    (int)
                    $profile->reviews_count,

                'format_online' =>
                    (bool)
                    $profile->format_online,

                'format_offline' =>
                    (bool)
                    $profile->format_offline,

                'verified_by' =>
                    $profile->verified_by,

                'verified_at' =>
                    $profile->verified_at,

                'verifier' =>
                    $profile->verified_by
                        ? [
                            'id' =>
                                $profile->verified_by,

                            'name' =>
                                $profile->verifier_name,

                            'email' =>
                                $profile->verifier_email,
                        ]
                        : null,

                'profile' => [
                    'avatar_url' =>
                        $profile->avatar_url,

                    'phone_number' =>
                        $profile->phone_number,

                    'university' =>
                        $profile->university,

                    'major' =>
                        $profile->major,

                    'github_url' =>
                        $profile->github_url,

                    'linkedin_url' =>
                        $profile->linkedin_url,
                ],

                'subjects' =>
                    $subjects,

                'availability' =>
                    $availability,

                'requests' => [
                    'pending' =>
                        (int)
                        $requestSummary
                            ->get(
                                'pending',
                                0
                            ),

                    'accepted' =>
                        (int)
                        $requestSummary
                            ->get(
                                'accepted',
                                0
                            ),

                    'completed' =>
                        (int)
                        $requestSummary
                            ->get(
                                'completed',
                                0
                            ),

                    'cancelled' =>
                        (int)
                        $requestSummary
                            ->get(
                                'cancelled',
                                0
                            ),
                ],

                'last_active_at' =>
                    $profile->last_active_at,

                'created_at' =>
                    $profile->created_at,
            ],
        ]);
    }

    /**
     * Verify / Unverify tutor.
     */
    public function updateVerification(
        Request $request,
        TutorProfile $tutorProfile
    ): JsonResponse {
        $validated = $request->validate([
            'is_verified' => [
                'required',
                'boolean',
            ],
        ]);

        $verified =
            (bool)
            $validated['is_verified'];

        $tutorProfile->is_verified =
            $verified;

        if ($verified) {
            $tutorProfile->verified_by =
                $request->user()->id;

            $tutorProfile->verified_at =
                now();
        } else {
            $tutorProfile->verified_by =
                null;

            $tutorProfile->verified_at =
                null;
        }

        $tutorProfile->save();

        return response()->json([
            'message' =>
                $verified
                    ? 'Tutor berhasil diverifikasi.'
                    : 'Verifikasi tutor berhasil dibatalkan.',

            'data' => [
                'id' =>
                    $tutorProfile->id,

                'user_id' =>
                    $tutorProfile->user_id,

                'is_verified' =>
                    $tutorProfile->is_verified,

                'verified_by' =>
                    $tutorProfile->verified_by,

                'verified_at' =>
                    $tutorProfile
                        ->verified_at
                        ?->toIso8601String(),
            ],
        ]);
    }
}