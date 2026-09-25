<?php

namespace App\Http\Controllers;

use App\Http\Resources\BuddyConnectionResource;
use App\Http\Resources\BuddyUserResource;
use App\Models\BuddyConnection;
use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BuddyController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
            'learning_styles' => ['nullable', 'array'],
            'learning_styles.*' => [
                'string',
                'in:Visual,Diskusi,Membaca Mandiri,Praktik Soal',
            ],
            'day_of_week' => [
                'nullable',
                'integer',
                'between:0,6',
                'required_with:start_time,end_time',
            ],
            'start_time' => [
                'nullable',
                'date_format:H:i',
                'required_with:day_of_week,end_time',
            ],
            'end_time' => [
                'nullable',
                'date_format:H:i',
                'after:start_time',
                'required_with:day_of_week,start_time',
            ],
        ]);

        $currentUser = $request->user();

        /*
         * Data profil user login menjadi dasar scoring otomatis.
         * Filter manual hanya mengganti dimensi yang dipilih user.
         */
        $currentUser->load([
            'userSubjects' => function ($query) {
                $query->where('type', 'learning');
            },
            'availabilities:id,user_id,day_of_week,start_time,end_time',
        ]);

        $profileSubjectIds = $currentUser->userSubjects
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $profileLearningStyles = collect($currentUser->learning_styles ?? [])
            ->map(fn ($style) => trim((string) $style))
            ->filter()
            ->unique()
            ->values();

        $profileAvailabilityWindows = $currentUser->availabilities
            ->map(fn ($availability) => [
                'day_of_week' => (int) $availability->day_of_week,
                'start_time' => substr((string) $availability->start_time, 0, 5),
                'end_time' => substr((string) $availability->end_time, 0, 5),
            ])
            ->values();

        $requestedSubjectIds = collect($validated['subject_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $requestedLearningStyles = collect($validated['learning_styles'] ?? [])
            ->map(fn ($style) => trim((string) $style))
            ->filter()
            ->unique()
            ->values();

        $hasScheduleFilter =
            isset($validated['day_of_week']) &&
            isset($validated['start_time']) &&
            isset($validated['end_time']);

        $requestedAvailabilityWindows = $hasScheduleFilter
            ? collect([[
                'day_of_week' => (int) $validated['day_of_week'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]])
            : collect();

        // Filter manual mengganti dimensi terkait; dimensi lain tetap dari profil.
        $scoreSubjectIds = $requestedSubjectIds->isNotEmpty()
            ? $requestedSubjectIds
            : $profileSubjectIds;

        $scoreLearningStyles = $requestedLearningStyles->isNotEmpty()
            ? $requestedLearningStyles
            : $profileLearningStyles;

        $scoreAvailabilityWindows = $requestedAvailabilityWindows->isNotEmpty()
            ? $requestedAvailabilityWindows
            : $profileAvailabilityWindows;

        $hasExplicitMatchingFilter =
            $requestedSubjectIds->isNotEmpty() ||
            $requestedLearningStyles->isNotEmpty() ||
            $hasScheduleFilter;

        $hasProfileMatchingCriteria =
            $profileSubjectIds->isNotEmpty() ||
            $profileLearningStyles->isNotEmpty() ||
            $profileAvailabilityWindows->isNotEmpty();

        $hasMatchingCriteria =
            $scoreSubjectIds->isNotEmpty() ||
            $scoreLearningStyles->isNotEmpty() ||
            $scoreAvailabilityWindows->isNotEmpty();

        $query = User::query()
            ->with([
                'profile:id,user_id,bio,avatar_url,university,major',
                'userSubjects' => function ($query) {
                    $query
                        ->where('type', 'learning')
                        ->with('subject:id,code,name');
                },
                'availabilities:id,user_id,day_of_week,start_time,end_time',
            ])
            ->where('id', '!=', $currentUser->id);

        if (!empty($validated['search'])) {
            $search = strtolower(trim($validated['search']));

            $query->where(function ($query) use ($search) {
                $query
                    ->whereRaw(
                        'LOWER(name) LIKE ?',
                        ["%{$search}%"]
                    )
                    ->orWhereRaw(
                        "LOWER(COALESCE(course, '')) LIKE ?",
                        ["%{$search}%"]
                    )
                    ->orWhereHas(
                        'profile',
                        function ($profileQuery) use ($search) {
                            $profileQuery->whereRaw(
                                "LOWER(COALESCE(bio, '')) LIKE ?",
                                ["%{$search}%"]
                            );
                        }
                    )
                    ->orWhereHas(
                        'userSubjects',
                        function ($userSubjectQuery) use ($search) {
                            $userSubjectQuery
                                ->where('type', 'learning')
                                ->whereHas(
                                    'subject',
                                    function ($subjectQuery) use ($search) {
                                        $subjectQuery
                                            ->whereRaw(
                                                'LOWER(name) LIKE ?',
                                                ["%{$search}%"]
                                            )
                                            ->orWhereRaw(
                                                'LOWER(code) LIKE ?',
                                                ["%{$search}%"]
                                            );
                                    }
                                );
                        }
                    );
            });
        }

        // Legacy course filter tetap dipertahankan untuk frontend lama.
        if (
            !empty($validated['course']) &&
            $validated['course'] !== 'Semua'
        ) {
            $query->where('course', $validated['course']);
        }

        /*
         * Subject hanya menjadi filter wajib jika user memang memilih
         * filter mata kuliah secara manual. Saat mode otomatis, seluruh
         * buddy tetap ditampilkan lalu diberi score berdasarkan profil.
         */
        if ($requestedSubjectIds->isNotEmpty()) {
            $query->whereHas(
                'userSubjects',
                function ($query) use ($requestedSubjectIds) {
                    $query
                        ->where('type', 'learning')
                        ->whereIn(
                            'subject_id',
                            $requestedSubjectIds->all()
                        );
                }
            );
        }

        // Filter jadwal manual tetap mempersempit hasil berdasarkan overlap.
        if ($hasScheduleFilter) {
            $dayOfWeek = (int) $validated['day_of_week'];
            $startTime = $validated['start_time'];
            $endTime = $validated['end_time'];

            $query->whereHas(
                'availabilities',
                function ($query) use ($dayOfWeek, $startTime, $endTime) {
                    $query
                        ->where('day_of_week', $dayOfWeek)
                        ->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                }
            );
        }

        $buddies = $query->get();

        $connections = BuddyConnection::query()
            ->where(function ($query) use ($currentUser) {
                $query
                    ->where('requester_id', $currentUser->id)
                    ->orWhere('receiver_id', $currentUser->id);
            })
            ->whereIn('status', ['pending', 'accepted'])
            ->latest()
            ->get();

        $connectionByBuddyId = [];

        foreach ($connections as $connection) {
            $buddyId =
                (int) $connection->requester_id === (int) $currentUser->id
                    ? (int) $connection->receiver_id
                    : (int) $connection->requester_id;

            if (!array_key_exists($buddyId, $connectionByBuddyId)) {
                $connectionByBuddyId[$buddyId] = $connection;
            }
        }

        $buddies->each(
            function ($buddy) use (
                $scoreSubjectIds,
                $scoreLearningStyles,
                $scoreAvailabilityWindows,
                $connectionByBuddyId,
                $currentUser
            ) {
                $matchedSubjects = $scoreSubjectIds->isEmpty()
                    ? collect()
                    : $buddy->userSubjects
                        ->whereIn('subject_id', $scoreSubjectIds->all())
                        ->map(function ($userSubject) {
                            if (!$userSubject->subject) {
                                return null;
                            }

                            return [
                                'id' => $userSubject->subject->id,
                                'code' => $userSubject->subject->code,
                                'name' => $userSubject->subject->name,
                            ];
                        })
                        ->filter()
                        ->unique('id')
                        ->values();

                $buddyLearningStyles = collect(
                    $buddy->learning_styles ?? []
                );

                $learningStyleMatch =
                    $scoreLearningStyles->isNotEmpty() &&
                    $buddyLearningStyles
                        ->intersect($scoreLearningStyles)
                        ->isNotEmpty();

                $availabilityMatch =
                    $scoreAvailabilityWindows->isNotEmpty() &&
                    $buddy->availabilities->contains(
                        function ($buddyAvailability) use ($scoreAvailabilityWindows) {
                            $buddyDay = (int) $buddyAvailability->day_of_week;
                            $buddyStart = substr(
                                (string) $buddyAvailability->start_time,
                                0,
                                5
                            );
                            $buddyEnd = substr(
                                (string) $buddyAvailability->end_time,
                                0,
                                5
                            );

                            return $scoreAvailabilityWindows->contains(
                                function ($window) use (
                                    $buddyDay,
                                    $buddyStart,
                                    $buddyEnd
                                ) {
                                    return
                                        $buddyDay === (int) $window['day_of_week'] &&
                                        $buddyStart < $window['end_time'] &&
                                        $buddyEnd > $window['start_time'];
                                }
                            );
                        }
                    );

                $matchScore = $matchedSubjects->count();

                if ($availabilityMatch) {
                    $matchScore++;
                }

                if ($learningStyleMatch) {
                    $matchScore++;
                }

                $buddy->setAttribute('match_score', $matchScore);
                $buddy->setAttribute(
                    'matched_subjects',
                    $matchedSubjects->all()
                );
                $buddy->setAttribute(
                    'availability_match',
                    $availabilityMatch
                );
                $buddy->setAttribute(
                    'learning_style_match',
                    $learningStyleMatch
                );

                $connection = $connectionByBuddyId[$buddy->id] ?? null;

                $this->attachConnectionState(
                    $buddy,
                    $connection,
                    $currentUser->id
                );
            }
        );

        if (!$hasMatchingCriteria) {
            $buddies = $buddies
                ->sortBy(fn ($buddy) => strtolower($buddy->name))
                ->values();
        } else {
            $buddies = $buddies
                ->sort(function ($a, $b) {
                    $aScore = (int) ($a->match_score ?? 0);
                    $bScore = (int) ($b->match_score ?? 0);

                    if ($aScore !== $bScore) {
                        return $bScore <=> $aScore;
                    }

                    $aActive = $a->last_active_at?->getTimestamp() ?? 0;
                    $bActive = $b->last_active_at?->getTimestamp() ?? 0;

                    if ($aActive !== $bActive) {
                        return $bActive <=> $aActive;
                    }

                    return strcasecmp($a->name, $b->name);
                })
                ->values();
        }

        $perPage = 12;
        $page = max(1, (int) $request->input('page', 1));

        $paginatedBuddies = new LengthAwarePaginator(
            $buddies
                ->forPage($page, $perPage)
                ->values(),
            $buddies->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $response = BuddyUserResource::collection($paginatedBuddies)
            ->response()
            ->getData(true);

        $response['matching'] = [
            'mode' => $hasExplicitMatchingFilter
                ? 'filters'
                : ($hasProfileMatchingCriteria ? 'profile' : 'none'),
            'has_criteria' => $hasMatchingCriteria,
        ];

        return $response;
    }

    public function show(Request $request, int $id)
    {
        $currentUser = $request->user();

        $buddy = User::query()
            ->with([
                'profile:id,user_id,bio,avatar_url,phone_number,university,major,github_url,linkedin_url',
                'userSubjects' => function ($query) {
                    $query
                        ->where('type', 'learning')
                        ->with('subject:id,code,name');
                },
                'availabilities:id,user_id,day_of_week,start_time,end_time,timezone,is_recurring',
            ])
            ->findOrFail($id);

        if ((int) $buddy->id === (int) $currentUser->id) {
            return response()->json([
                'message' => 'Profil ini adalah profil Anda sendiri.',
            ], 422);
        }

        $connection = $this->findConnection(
            $currentUser->id,
            $buddy->id
        );

        $this->attachConnectionState(
            $buddy,
            $connection,
            $currentUser->id
        );

        $groups = StudyGroup::query()
            ->with(['subject:id,code,name'])
            ->withCount([
                'members as members_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])
            ->where('creator_id', $buddy->id)
            ->latest()
            ->get();

        $groupIds = $groups->pluck('id');

        $memberships = $groupIds->isEmpty()
            ? collect()
            : DB::table('group_members')
                ->whereIn('study_group_id', $groupIds)
                ->where('user_id', $currentUser->id)
                ->get()
                ->keyBy('study_group_id');

        $buddyData = (new BuddyUserResource($buddy))
            ->resolve($request);

        $buddyData['related_groups'] = $groups
            ->map(function ($group) use ($memberships) {
                $membership = $memberships->get($group->id);

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'max_members' => $group->max_members,
                    'members_count' => (int) $group->members_count,
                    'is_private' => (bool) $group->is_private,
                    'is_full' =>
                        (int) $group->members_count >=
                        (int) $group->max_members,
                    'membership_status' =>
                        $membership->status ?? null,
                    'subject' => $group->subject
                        ? [
                            'id' => $group->subject->id,
                            'code' => $group->subject->code,
                            'name' => $group->subject->name,
                        ]
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'data' => $buddyData,
        ]);
    }

    public function connections(Request $request)
    {
        $currentUser = $request->user();

        $connections = BuddyConnection::query()
            ->with([
                'requester.profile',
                'receiver.profile',
            ])
            ->where(function ($query) use ($currentUser) {
                $query
                    ->where('requester_id', $currentUser->id)
                    ->orWhere('receiver_id', $currentUser->id);
            })
            ->whereIn('status', ['pending', 'accepted'])
            ->latest()
            ->get();

        return response()->json([
            'data' => BuddyConnectionResource::collection(
                $connections
            )->resolve($request),
        ]);
    }

    public function connect(Request $request, int $id)
    {
        $currentUser = $request->user();
        $buddy = User::findOrFail($id);

        if ((int) $currentUser->id === (int) $buddy->id) {
            return response()->json([
                'message' =>
                    'Tidak dapat melakukan connect ke diri sendiri.',
            ], 422);
        }

        $result = DB::transaction(function () use ($currentUser, $buddy) {
            User::query()
                ->whereIn('id', [$currentUser->id, $buddy->id])
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $existingConnection = $this->findConnection(
                $currentUser->id,
                $buddy->id,
                true
            );

            if (
                $existingConnection &&
                in_array(
                    $existingConnection->status,
                    ['pending', 'accepted'],
                    true
                )
            ) {
                return [
                    'existing' => $existingConnection,
                ];
            }

            if (
                $existingConnection &&
                $existingConnection->status === 'rejected'
            ) {
                $existingConnection->update([
                    'requester_id' => $currentUser->id,
                    'receiver_id' => $buddy->id,
                    'status' => 'pending',
                ]);

                return [
                    'connection' => $existingConnection->fresh(),
                ];
            }

            return [
                'connection' => BuddyConnection::create([
                    'requester_id' => $currentUser->id,
                    'receiver_id' => $buddy->id,
                    'status' => 'pending',
                ]),
            ];
        });

        if (isset($result['existing'])) {
            return response()->json([
                'message' =>
                    'Hubungan atau permintaan koneksi masih aktif.',
                'status' => $result['existing']->status,
                'connection_id' => $result['existing']->id,
            ], 409);
        }

        $connection = $result['connection'];

        $connection->load([
            'requester.profile',
            'receiver.profile',
        ]);

        return response()->json([
            'message' =>
                'Permintaan koneksi berhasil dikirim.',
            'data' =>
                (new BuddyConnectionResource($connection))
                    ->resolve($request),
        ], 201);
    }

    public function accept(
        Request $request,
        BuddyConnection $connection
    ) {
        if (
            (int) $connection->receiver_id !==
            (int) $request->user()->id
        ) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki akses untuk menerima permintaan ini.',
            ], 403);
        }

        if ($connection->status !== 'pending') {
            return response()->json([
                'message' =>
                    'Permintaan ini sudah tidak berstatus pending.',
            ], 422);
        }

        $connection->update([
            'status' => 'accepted',
        ]);

        $connection->load([
            'requester.profile',
            'receiver.profile',
        ]);

        return response()->json([
            'message' =>
                'Permintaan buddy berhasil diterima.',
            'data' =>
                (new BuddyConnectionResource($connection))
                    ->resolve($request),
        ]);
    }

    public function reject(
        Request $request,
        BuddyConnection $connection
    ) {
        if (
            (int) $connection->receiver_id !==
            (int) $request->user()->id
        ) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki akses untuk menolak permintaan ini.',
            ], 403);
        }

        if ($connection->status !== 'pending') {
            return response()->json([
                'message' =>
                    'Permintaan ini sudah tidak berstatus pending.',
            ], 422);
        }

        $connection->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'message' =>
                'Permintaan buddy berhasil ditolak.',
        ]);
    }

    public function destroy(
        Request $request,
        BuddyConnection $connection
    ) {
        $currentUserId = (int) $request->user()->id;

        $isRequester =
            (int) $connection->requester_id === $currentUserId;

        $isReceiver =
            (int) $connection->receiver_id === $currentUserId;

        if (!$isRequester && !$isReceiver) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki akses ke koneksi ini.',
            ], 403);
        }

        if (
            $connection->status === 'pending' &&
            !$isRequester
        ) {
            return response()->json([
                'message' =>
                    'Receiver harus menolak request melalui aksi Tolak.',
            ], 403);
        }

        $wasAccepted = $connection->status === 'accepted';

        $connection->delete();

        return response()->json([
            'message' => $wasAccepted
                ? 'Koneksi buddy berhasil diputus.'
                : 'Permintaan buddy berhasil dibatalkan.',
        ]);
    }

    private function findConnection(
        int $firstUserId,
        int $secondUserId,
        bool $lockForUpdate = false
    ): ?BuddyConnection {
        $query = BuddyConnection::query()
            ->where(function ($query) use (
                $firstUserId,
                $secondUserId
            ) {
                $query
                    ->where('requester_id', $firstUserId)
                    ->where('receiver_id', $secondUserId);
            })
            ->orWhere(function ($query) use (
                $firstUserId,
                $secondUserId
            ) {
                $query
                    ->where('requester_id', $secondUserId)
                    ->where('receiver_id', $firstUserId);
            });

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function attachConnectionState(
        User $buddy,
        ?BuddyConnection $connection,
        int $currentUserId
    ): void {
        $buddy->setAttribute(
            'connection_id',
            $connection?->id
        );

        $buddy->setAttribute(
            'connection_status',
            $connection?->status
        );

        $buddy->setAttribute(
            'connection_direction',
            !$connection
                ? null
                : (
                    (int) $connection->requester_id ===
                    (int) $currentUserId
                        ? 'outgoing'
                        : 'incoming'
                )
        );

        $buddy->setAttribute(
            'is_connected',
            $connection?->status === 'accepted'
        );
    }
}
