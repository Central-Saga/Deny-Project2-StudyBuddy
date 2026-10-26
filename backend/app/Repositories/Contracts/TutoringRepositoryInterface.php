<?php

namespace App\Repositories\Contracts;

use App\Models\TutoringReview;
use App\Models\TutorProfile;
use Illuminate\Support\Collection;

interface TutoringRepositoryInterface
{
    public function transaction(callable $callback): mixed;

    public function searchActiveTutors(int $excludeUserId, array $filters): Collection;

    public function subjectsForProfiles(Collection $profileIds): Collection;

    public function availabilityForProfiles(Collection $profileIds): Collection;

    public function findProfileByUserId(int $userId): ?object;

    public function findProfile(int $profileId): ?object;

    public function findActiveProfile(int $profileId): ?object;

    public function subjectIdsOf(int $profileId): Collection;

    public function availabilityOf(int $profileId): Collection;

    public function updateProfile(int $profileId, array $data): void;

    public function insertProfile(array $data): int;

    public function replaceSubjects(int $profileId, array $rows): void;

    public function replaceAvailability(int $profileId, array $rows): void;

    public function outgoingRequests(int $userId): Collection;

    public function incomingRequests(int $userId): Collection;

    public function tutorOffersSubject(int $profileId, int $subjectId): bool;

    public function hasActiveDuplicateRequest(
        int $studentId,
        int $profileId,
        string $normalizedTopic
    ): bool;

    public function hasAvailabilityCovering(
        int $profileId,
        int $dayOfWeek,
        string $startTime,
        string $endTime
    ): bool;

    public function insertRequest(array $data): int;

    public function findRequest(int $id): ?object;

    public function updateRequest(int $id, array $data): void;

    public function insertNotification(array $data): void;

    public function reviewsForTutor(int $tutorProfileId): Collection;

    public function reviewExistsForRequest(int $tutoringRequestId): bool;

    public function createReview(array $data): TutoringReview;

    public function refreshTutorRating(int $tutorProfileId): void;

    public function adminTutorList(array $filters): Collection;

    public function adminTutorDetail(int $profileId): ?object;

    public function adminSubjectsForProfiles(Collection $profileIds): Collection;

    public function adminSubjectsOf(int $profileId): Collection;

    public function requestStatusSummary(int $profileId): Collection;

    public function saveVerification(
        TutorProfile $profile,
        bool $verified,
        ?int $verifierId
    ): TutorProfile;
}
