<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TutoringApiTest extends TestCase
{
    use RefreshDatabase;

    private function createSubject(): Subject
    {
        return Subject::create([
            'code' => 'TUT' . fake()->unique()->numberBetween(100, 999),
            'name' => 'Tutoring Subject ' . fake()->unique()->numberBetween(100, 999),
            'slug' => 'tutoring-subject-' . fake()->unique()->numberBetween(100, 999),
        ]);
    }

    private function createTutor(
        User $user,
        Subject $subject,
        array $overrides = []
    ): int {
        $profileId = DB::table('tutor_profiles')->insertGetId(array_merge([
            'user_id' => $user->id,
            'bio' => 'Tutor untuk automated test.',
            'hourly_rate' => 0,
            'is_verified' => false,
            'status' => 'active',
            'rating_avg' => 0,
            'reviews_count' => 0,
            'format_online' => true,
            'format_offline' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        DB::table('tutor_subjects')->insert([
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'proficiency_level' => 'advanced',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tutor_availabilities')->insert([
            'tutor_profile_id' => $profileId,
            'day_of_week' => 1,
            'start_time' => '18:00:00',
            'end_time' => '22:00:00',
            'is_recurring' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $profileId;
    }

    private function nextMondayAt(string $time = '19:00:00'): string
    {
        return now()
            ->next('Monday')
            ->setTimeFromTimeString($time)
            ->format('Y-m-d H:i:s');
    }

    public function test_user_can_create_tutor_profile_with_formats_and_availability(): void
    {
        $user = User::factory()->create();
        $subject = $this->createSubject();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/v1/tutoring/profile', [
                'bio' => 'Saya membantu belajar basis data.',
                'subject_ids' => [$subject->id],
                'format_online' => true,
                'format_offline' => false,
                'availability' => [[
                    'day_of_week' => 1,
                    'start_time' => '18:00',
                    'end_time' => '21:00',
                ]],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Profil tutor berhasil disimpan.');

        $this->assertDatabaseHas('tutor_profiles', [
            'user_id' => $user->id,
            'status' => 'active',
            'format_online' => true,
            'format_offline' => false,
        ]);

        $this->assertDatabaseHas('tutor_availabilities', [
            'day_of_week' => 1,
        ]);
    }

    public function test_tutor_can_deactivate_profile_and_disappears_from_search(): void
    {
        $tutor = User::factory()->create();
        $student = User::factory()->create();
        $subject = $this->createSubject();

        $this->createTutor($tutor, $subject);

        $this
            ->actingAs($tutor, 'sanctum')
            ->patchJson('/api/v1/tutoring/profile/status', [
                'status' => 'inactive',
            ])
            ->assertOk();

        $this
            ->actingAs($student, 'sanctum')
            ->getJson('/api/v1/tutoring/tutors')
            ->assertOk()
            ->assertJsonCount(0);
    }

    public function test_tutor_search_filters_subject_format_and_availability(): void
    {
        $student = User::factory()->create();
        $onlineTutor = User::factory()->create();
        $offlineTutor = User::factory()->create();
        $subject = $this->createSubject();

        $this->createTutor($onlineTutor, $subject, [
            'format_online' => true,
            'format_offline' => false,
        ]);

        $this->createTutor($offlineTutor, $subject, [
            'format_online' => false,
            'format_offline' => true,
        ]);

        $response = $this
            ->actingAs($student, 'sanctum')
            ->getJson(
                "/api/v1/tutoring/tutors?subject_id={$subject->id}"
                . '&format=online&day_of_week=1&time=19:00'
            );

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', $onlineTutor->name)
            ->assertJsonPath('0.format_online', true)
            ->assertJsonPath('0.format_offline', false);
    }

    public function test_duplicate_active_request_for_same_tutor_and_topic_is_rejected(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $payload = [
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Normalisasi Database',
            'notes' => null,
            'scheduled_at' => $this->nextMondayAt(),
            'duration_minutes' => 60,
        ];

        $this
            ->actingAs($student, 'sanctum')
            ->postJson('/api/v1/tutoring/requests', $payload)
            ->assertCreated();

        $this
            ->actingAs($student, 'sanctum')
            ->postJson('/api/v1/tutoring/requests', array_merge(
                $payload,
                ['topic' => '  normalisasi database  ']
            ))
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Anda sudah memiliki request aktif untuk tutor dan topik yang sama.'
            );
    }

    public function test_request_outside_tutor_availability_is_rejected(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $this
            ->actingAs($student, 'sanctum')
            ->postJson('/api/v1/tutoring/requests', [
                'tutor_profile_id' => $profileId,
                'subject_id' => $subject->id,
                'topic' => 'Belajar SQL',
                'scheduled_at' => $this->nextMondayAt('10:00:00'),
                'duration_minutes' => 60,
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Jadwal yang dipilih berada di luar availability tutor.'
            );
    }

    public function test_tutor_can_accept_request_with_online_session_details(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $create = $this
            ->actingAs($student, 'sanctum')
            ->postJson('/api/v1/tutoring/requests', [
                'tutor_profile_id' => $profileId,
                'subject_id' => $subject->id,
                'topic' => 'Laravel Routing',
                'scheduled_at' => $this->nextMondayAt(),
                'duration_minutes' => 60,
            ])
            ->assertCreated();

        $requestId = (int) $create->json('request_id');

        $this
            ->actingAs($tutor, 'sanctum')
            ->patchJson("/api/v1/tutoring/requests/{$requestId}/status", [
                'status' => 'accepted',
                'scheduled_at' => $this->nextMondayAt(),
                'duration_minutes' => 60,
                'session_format' => 'online',
                'meeting_link' => 'https://meet.google.com/test-session',
                'session_notes' => 'Siapkan project Laravel.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.session_format', 'online')
            ->assertJsonPath(
                'data.meeting_link',
                'https://meet.google.com/test-session'
            );
    }

    public function test_unrelated_user_cannot_change_tutoring_request_status(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $stranger = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $requestId = DB::table('tutoring_requests')->insertGetId([
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Testing Permission',
            'scheduled_at' => $this->nextMondayAt(),
            'duration_minutes' => 60,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->actingAs($stranger, 'sanctum')
            ->patchJson("/api/v1/tutoring/requests/{$requestId}/status", [
                'status' => 'rejected',
            ])
            ->assertForbidden();
    }

    public function test_student_can_cancel_pending_request(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $requestId = DB::table('tutoring_requests')->insertGetId([
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Request untuk dibatalkan',
            'scheduled_at' => $this->nextMondayAt(),
            'duration_minutes' => 60,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->actingAs($student, 'sanctum')
            ->patchJson("/api/v1/tutoring/requests/{$requestId}/status", [
                'status' => 'cancelled',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_tutor_can_update_accepted_session_and_complete_it(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $requestId = DB::table('tutoring_requests')->insertGetId([
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Algoritma',
            'scheduled_at' => $this->nextMondayAt(),
            'duration_minutes' => 60,
            'status' => 'accepted',
            'session_format' => 'online',
            'meeting_link' => 'https://meet.google.com/old-link',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->actingAs($tutor, 'sanctum')
            ->patchJson("/api/v1/tutoring/requests/{$requestId}/session", [
                'scheduled_at' => $this->nextMondayAt('20:00:00'),
                'duration_minutes' => 60,
                'session_format' => 'offline',
                'location' => 'Perpustakaan Kampus',
                'session_notes' => 'Bawa catatan algoritma.',
            ])
            ->assertOk()
            ->assertJsonPath('data.session_format', 'offline')
            ->assertJsonPath('data.location', 'Perpustakaan Kampus');

        $this
            ->actingAs($tutor, 'sanctum')
            ->patchJson("/api/v1/tutoring/requests/{$requestId}/status", [
                'status' => 'completed',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_tutor_search_returns_profile_avatar_url(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();

        $this->createTutor($tutor, $subject);

        DB::table('profiles')->updateOrInsert(
            ['user_id' => $tutor->id],
            [
                'avatar_url' => 'https://example.com/tutor-avatar.jpg',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $this
            ->actingAs($student, 'sanctum')
            ->getJson('/api/v1/tutoring/tutors')
            ->assertOk()
            ->assertJsonPath(
                '0.avatar_url',
                'https://example.com/tutor-avatar.jpg'
            );
    }

    public function test_request_list_exposes_existing_review_state(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $requestId = DB::table('tutoring_requests')->insertGetId([
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Review State Test',
            'scheduled_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $reviewId = DB::table('tutoring_reviews')->insertGetId([
            'tutoring_request_id' => $requestId,
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'rating' => 5,
            'comment' => 'Tutor sangat membantu.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->actingAs($student, 'sanctum')
            ->getJson('/api/v1/tutoring/requests')
            ->assertOk()
            ->assertJsonPath('outgoing.0.review_id', $reviewId)
            ->assertJsonPath('outgoing.0.review_rating', 5)
            ->assertJsonPath(
                'outgoing.0.review_comment',
                'Tutor sangat membantu.'
            );
    }


    public function test_authenticated_user_can_view_tutor_reviews(): void
    {
        $student = User::factory()->create();
        $viewer = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();
        $profileId = $this->createTutor($tutor, $subject);

        $requestId = DB::table('tutoring_requests')->insertGetId([
            'student_id' => $student->id,
            'tutor_profile_id' => $profileId,
            'subject_id' => $subject->id,
            'topic' => 'Review List Test',
            'scheduled_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->actingAs($student, 'sanctum')
            ->postJson("/api/v1/tutoring/requests/{$requestId}/reviews", [
                'rating' => 5,
                'comment' => 'Penjelasan tutor sangat jelas.',
            ])
            ->assertCreated();

        $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/v1/tutoring/tutors/{$profileId}/reviews")
            ->assertOk()
            ->assertJsonPath('tutor.rating_avg', 5)
            ->assertJsonPath('tutor.reviews_count', 1)
            ->assertJsonPath('data.0.rating', 5)
            ->assertJsonPath(
                'data.0.comment',
                'Penjelasan tutor sangat jelas.'
            )
            ->assertJsonPath('data.0.student.name', $student->name);
    }

}
