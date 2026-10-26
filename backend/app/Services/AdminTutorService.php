<?php

namespace App\Services;

use App\Models\TutorProfile;
use App\Repositories\Contracts\TutoringRepositoryInterface;
use Illuminate\Support\Collection;

class AdminTutorService
{
    public function __construct(private TutoringRepositoryInterface $repository)
    {
    }

    public function list(array $filters): Collection
    {
        $profiles = $this->repository->adminTutorList($filters);
        $subjects = $this->repository->adminSubjectsForProfiles($profiles->pluck('id'));

        return $profiles->map(fn ($profile) => [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'name' => $profile->name,
            'email' => $profile->email,
            'bio' => $profile->bio,
            'hourly_rate' => (float) $profile->hourly_rate,
            'is_verified' => (bool) $profile->is_verified,
            'status' => $profile->status,
            'account_status' => $profile->account_status,
            'rating_avg' => (float) $profile->rating_avg,
            'reviews_count' => (int) $profile->reviews_count,
            'format_online' => (bool) $profile->format_online,
            'format_offline' => (bool) $profile->format_offline,
            'avatar_url' => $profile->avatar_url,
            'university' => $profile->university,
            'major' => $profile->major,
            'verified_by' => $profile->verified_by,
            'verified_at' => $profile->verified_at,
            'verifier_name' => $profile->verifier_name,
            'created_at' => $profile->created_at,
            'subjects' => $subjects->get($profile->id, collect())->values(),
        ])->values();
    }

    public function detail(int $profileId): ?array
    {
        $profile = $this->repository->adminTutorDetail($profileId);

        if (!$profile) {
            return null;
        }

        $summary = $this->repository->requestStatusSummary($profile->id);

        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'name' => $profile->name,
            'email' => $profile->email,
            'bio' => $profile->bio,
            'hourly_rate' => (float) $profile->hourly_rate,
            'is_verified' => (bool) $profile->is_verified,
            'status' => $profile->status,
            'account_status' => $profile->account_status,
            'rating_avg' => (float) $profile->rating_avg,
            'reviews_count' => (int) $profile->reviews_count,
            'format_online' => (bool) $profile->format_online,
            'format_offline' => (bool) $profile->format_offline,
            'verified_by' => $profile->verified_by,
            'verified_at' => $profile->verified_at,
            'verifier' => $profile->verified_by ? [
                'id' => $profile->verified_by,
                'name' => $profile->verifier_name,
                'email' => $profile->verifier_email,
            ] : null,
            'profile' => [
                'avatar_url' => $profile->avatar_url,
                'phone_number' => $profile->phone_number,
                'university' => $profile->university,
                'major' => $profile->major,
                'github_url' => $profile->github_url,
                'linkedin_url' => $profile->linkedin_url,
            ],
            'subjects' => $this->repository->adminSubjectsOf($profile->id),
            'availability' => $this->repository->availabilityOf($profile->id),
            'requests' => [
                'pending' => (int) $summary->get('pending', 0),
                'accepted' => (int) $summary->get('accepted', 0),
                'completed' => (int) $summary->get('completed', 0),
                'cancelled' => (int) $summary->get('cancelled', 0),
            ],
            'last_active_at' => $profile->last_active_at,
            'created_at' => $profile->created_at,
        ];
    }

    public function updateVerification(
        TutorProfile $tutorProfile,
        bool $verified,
        int $verifierId
    ): array {
        $profile = $this->repository->saveVerification($tutorProfile, $verified, $verifierId);

        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'is_verified' => $profile->is_verified,
            'verified_by' => $profile->verified_by,
            'verified_at' => $profile->verified_at?->toIso8601String(),
        ];
    }
}
