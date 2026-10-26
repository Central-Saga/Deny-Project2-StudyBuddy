<?php

namespace App\Repositories\Eloquent;

use App\Models\TutoringReview;
use App\Models\TutorProfile;
use App\Repositories\Contracts\TutoringRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TutoringRepository implements TutoringRepositoryInterface
{
    public function transaction(callable $callback): mixed
    {
        return DB::transaction($callback);
    }

    public function searchActiveTutors(int $excludeUserId, array $filters): Collection
    {
        $query = DB::table('tutor_profiles as tp')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->leftJoin('profiles as p', 'p.user_id', '=', 'u.id')
            ->where('tp.status', 'active')
            ->where('tp.user_id', '<>', $excludeUserId);

        if (!empty($filters['subject_id'])) {
            $subjectId = (int) $filters['subject_id'];

            $query->whereExists(function ($subjectQuery) use ($subjectId) {
                $subjectQuery
                    ->select(DB::raw(1))
                    ->from('tutor_subjects as ts_filter')
                    ->whereColumn('ts_filter.tutor_profile_id', 'tp.id')
                    ->where('ts_filter.subject_id', $subjectId);
            });
        }

        if (($filters['format'] ?? null) === 'online') {
            $query->where('tp.format_online', true);
        }

        if (($filters['format'] ?? null) === 'offline') {
            $query->where('tp.format_offline', true);
        }

        if (array_key_exists('day_of_week', $filters)) {
            $dayOfWeek = (int) $filters['day_of_week'];
            $time = $filters['time'] ?? null;

            $query->whereExists(function ($availabilityQuery) use ($dayOfWeek, $time) {
                $availabilityQuery
                    ->select(DB::raw(1))
                    ->from('tutor_availabilities as ta_filter')
                    ->whereColumn('ta_filter.tutor_profile_id', 'tp.id')
                    ->where('ta_filter.day_of_week', $dayOfWeek);

                if ($time) {
                    $availabilityQuery
                        ->where('ta_filter.start_time', '<=', $time)
                        ->where('ta_filter.end_time', '>', $time);
                }
            });
        }

        return $query
            ->orderByDesc('u.last_active_at')
            ->orderByDesc('tp.rating_avg')
            ->orderByDesc('tp.reviews_count')
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
                'u.name',
                'u.email',
                'u.last_active_at',
                'p.avatar_url',
            ])
            ->get();
    }

    public function subjectsForProfiles(Collection $profileIds): Collection
    {
        return DB::table('tutor_subjects as ts')
            ->join('subjects as s', 's.id', '=', 'ts.subject_id')
            ->whereIn('ts.tutor_profile_id', $profileIds)
            ->select([
                'ts.tutor_profile_id',
                's.id',
                's.name',
                's.code',
                'ts.proficiency_level',
            ])
            ->get()
            ->groupBy('tutor_profile_id');
    }

    public function availabilityForProfiles(Collection $profileIds): Collection
    {
        return DB::table('tutor_availabilities')
            ->whereIn('tutor_profile_id', $profileIds)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->groupBy('tutor_profile_id');
    }

    public function findProfileByUserId(int $userId): ?object
    {
        return DB::table('tutor_profiles')->where('user_id', $userId)->first();
    }

    public function findProfile(int $profileId): ?object
    {
        return DB::table('tutor_profiles')->where('id', $profileId)->first();
    }

    public function findActiveProfile(int $profileId): ?object
    {
        return DB::table('tutor_profiles')
            ->where('id', $profileId)
            ->where('status', 'active')
            ->first();
    }

    public function subjectIdsOf(int $profileId): Collection
    {
        return DB::table('tutor_subjects')
            ->where('tutor_profile_id', $profileId)
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->values();
    }

    public function availabilityOf(int $profileId): Collection
    {
        return DB::table('tutor_availabilities')
            ->where('tutor_profile_id', $profileId)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->values();
    }

    public function updateProfile(int $profileId, array $data): void
    {
        DB::table('tutor_profiles')->where('id', $profileId)->update($data);
    }

    public function insertProfile(array $data): int
    {
        return DB::table('tutor_profiles')->insertGetId($data);
    }

    public function replaceSubjects(int $profileId, array $rows): void
    {
        DB::table('tutor_subjects')->where('tutor_profile_id', $profileId)->delete();

        foreach ($rows as $row) {
            DB::table('tutor_subjects')->insert($row);
        }
    }

    public function replaceAvailability(int $profileId, array $rows): void
    {
        DB::table('tutor_availabilities')->where('tutor_profile_id', $profileId)->delete();

        foreach ($rows as $row) {
            DB::table('tutor_availabilities')->insert($row);
        }
    }

    public function outgoingRequests(int $userId): Collection
    {
        return DB::table('tutoring_requests as tr')
            ->join('tutor_profiles as tp', 'tp.id', '=', 'tr.tutor_profile_id')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->leftJoin('tutoring_reviews as rev', 'rev.tutoring_request_id', '=', 'tr.id')
            ->where('tr.student_id', $userId)
            ->orderByDesc('tr.created_at')
            ->select([
                'tr.*',
                'u.name as tutor_name',
                's.name as subject_name',
                'rev.id as review_id',
                'rev.rating as review_rating',
                'rev.comment as review_comment',
            ])
            ->get();
    }

    public function incomingRequests(int $userId): Collection
    {
        return DB::table('tutoring_requests as tr')
            ->join('tutor_profiles as tp', 'tp.id', '=', 'tr.tutor_profile_id')
            ->join('users as u', 'u.id', '=', 'tr.student_id')
            ->join('subjects as s', 's.id', '=', 'tr.subject_id')
            ->where('tp.user_id', $userId)
            ->orderByDesc('tr.created_at')
            ->select([
                'tr.*',
                'u.name as student_name',
                's.name as subject_name',
            ])
            ->get();
    }

    public function tutorOffersSubject(int $profileId, int $subjectId): bool
    {
        return DB::table('tutor_subjects')
            ->where('tutor_profile_id', $profileId)
            ->where('subject_id', $subjectId)
            ->exists();
    }

    public function hasActiveDuplicateRequest(
        int $studentId,
        int $profileId,
        string $normalizedTopic
    ): bool {
        return DB::table('tutoring_requests')
            ->where('student_id', $studentId)
            ->where('tutor_profile_id', $profileId)
            ->whereIn('status', ['pending', 'accepted'])
            ->whereRaw('LOWER(TRIM(topic)) = ?', [$normalizedTopic])
            ->exists();
    }

    public function hasAvailabilityCovering(
        int $profileId,
        int $dayOfWeek,
        string $startTime,
        string $endTime
    ): bool {
        return DB::table('tutor_availabilities')
            ->where('tutor_profile_id', $profileId)
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<=', $startTime)
            ->where('end_time', '>=', $endTime)
            ->exists();
    }

    public function insertRequest(array $data): int
    {
        return DB::table('tutoring_requests')->insertGetId($data);
    }

    public function findRequest(int $id): ?object
    {
        return DB::table('tutoring_requests')->where('id', $id)->first();
    }

    public function updateRequest(int $id, array $data): void
    {
        DB::table('tutoring_requests')->where('id', $id)->update($data);
    }

    public function insertNotification(array $data): void
    {
        DB::table('notifications')->insert($data);
    }

    public function reviewsForTutor(int $tutorProfileId): Collection
    {
        return TutoringReview::query()
            ->with('student:id,name')
            ->where('tutor_profile_id', $tutorProfileId)
            ->latest()
            ->get();
    }

    public function reviewExistsForRequest(int $tutoringRequestId): bool
    {
        return TutoringReview::query()
            ->where('tutoring_request_id', $tutoringRequestId)
            ->exists();
    }

    public function createReview(array $data): TutoringReview
    {
        return TutoringReview::create($data);
    }

    public function refreshTutorRating(int $tutorProfileId): void
    {
        $statistics = TutoringReview::query()
            ->where('tutor_profile_id', $tutorProfileId)
            ->selectRaw('COUNT(*) as reviews_count, AVG(rating) as rating_avg')
            ->first();

        TutorProfile::query()
            ->whereKey($tutorProfileId)
            ->update([
                'rating_avg' => round((float) $statistics->rating_avg, 2),
                'reviews_count' => (int) $statistics->reviews_count,
            ]);
    }

    public function adminTutorList(array $filters): Collection
    {
        $query = DB::table('tutor_profiles as tp')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->leftJoin('profiles as p', 'p.user_id', '=', 'u.id')
            ->leftJoin('users as verifier', 'verifier.id', '=', 'tp.verified_by');

        if (!empty($filters['search'])) {
            $search = strtolower(trim($filters['search']));

            $query->where(function ($query) use ($search) {
                $like = "%{$search}%";

                $query
                    ->whereRaw('LOWER(u.name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(u.email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(p.university, \'\')) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(p.major, \'\')) LIKE ?', [$like]);
            });
        }

        if (isset($filters['verification'])) {
            $query->where('tp.is_verified', $filters['verification'] === 'verified');
        }

        if (isset($filters['status'])) {
            $query->where('tp.status', $filters['status']);
        }

        return $query
            ->orderByDesc('tp.created_at')
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
    }

    public function adminTutorDetail(int $profileId): ?object
    {
        return DB::table('tutor_profiles as tp')
            ->join('users as u', 'u.id', '=', 'tp.user_id')
            ->leftJoin('profiles as p', 'p.user_id', '=', 'u.id')
            ->leftJoin('users as verifier', 'verifier.id', '=', 'tp.verified_by')
            ->where('tp.id', $profileId)
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
    }

    public function adminSubjectsForProfiles(Collection $profileIds): Collection
    {
        return $this->subjectsForProfiles($profileIds);
    }

    public function adminSubjectsOf(int $profileId): Collection
    {
        return DB::table('tutor_subjects as ts')
            ->join('subjects as s', 's.id', '=', 'ts.subject_id')
            ->where('ts.tutor_profile_id', $profileId)
            ->select([
                's.id',
                's.name',
                's.code',
                'ts.proficiency_level',
            ])
            ->get();
    }

    public function requestStatusSummary(int $profileId): Collection
    {
        return DB::table('tutoring_requests')
            ->where('tutor_profile_id', $profileId)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
    }

    public function saveVerification(
        TutorProfile $profile,
        bool $verified,
        ?int $verifierId
    ): TutorProfile {
        $profile->is_verified = $verified;
        $profile->verified_by = $verified ? $verifierId : null;
        $profile->verified_at = $verified ? now() : null;
        $profile->save();

        return $profile;
    }
}
