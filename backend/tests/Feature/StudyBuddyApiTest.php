<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\StudyGroup;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\TutoringRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudyBuddyApiTest extends TestCase
{
    use RefreshDatabase;

    private function createSubject(): Subject
    {
        return Subject::create([
            'code' => 'TEST' . fake()->unique()->numberBetween(100, 999),
            'name' => 'Test Subject ' . fake()->unique()->numberBetween(100, 999),
            'slug' => 'test-subject-' . fake()->unique()->numberBetween(100, 999),
        ]);
    }

    private function createGroup(User $user): StudyGroup
    {
        $subject = $this->createSubject();

        $group = StudyGroup::create([
            'creator_id' => $user->id,
            'subject_id' => $subject->id,
            'name' => 'Test Study Group',
            'slug' => 'test-study-group-' . fake()->unique()->numberBetween(1000, 9999),
            'description' => 'Group untuk automated test.',
            'max_members' => 10,
            'is_private' => false,
        ]);

        $group->members()->create([
            'user_id' => $user->id,
            'role' => 'admin',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        return $group;
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Test Register User',
            'email' => 'register@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Registrasi berhasil')
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'register@example.com',
            'name' => 'Test Register User',
        ]);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login berhasil')
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user',
            ]);
    }

    public function test_user_can_create_group(): void
    {
        $user = User::factory()->create();
        $subject = $this->createSubject();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/v1/groups', [
                'name' => 'Group Test API',
                'subject_id' => $subject->id,
                'description' => 'Group untuk pengujian API.',
                'max_members' => 10,
                'is_private' => false,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'Group Test API')
            ->assertJsonPath('creator_id', $user->id)
            ->assertJsonStructure([
                'id',
                'name',
                'slug',
                'creator_id',
                'subject_id',
                'members',
            ]);

        $this->assertDatabaseHas('study_groups', [
            'name' => 'Group Test API',
            'creator_id' => $user->id,
            'subject_id' => $subject->id,
        ]);

        $this->assertDatabaseHas('group_members', [
            'user_id' => $user->id,
            'role' => 'admin',
            'status' => 'accepted',
        ]);
    }

    public function test_user_can_join_public_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = $this->createGroup($owner);

        $response = $this
            ->actingAs($member, 'sanctum')
            ->postJson("/api/v1/groups/{$group->id}/toggle-join");

        $response
            ->assertOk()
            ->assertJsonPath('joined', true)
            ->assertJsonPath('status', 'accepted');

        $this->assertDatabaseHas('group_members', [
            'study_group_id' => $group->id,
            'user_id' => $member->id,
            'role' => 'member',
            'status' => 'accepted',
        ]);
    }

    public function test_creator_cannot_leave_own_group(): void
    {
        $user = User::factory()->create();

        $group = $this->createGroup($user);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson("/api/v1/groups/{$group->id}/toggle-join");

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Creator grup tidak dapat keluar dari grup. Transfer pengelolaan grup terlebih dahulu.'
            );
    }

    public function test_group_creator_can_create_study_session(): void
    {
        $creator = User::factory()->create();

        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($creator, 'sanctum')
            ->postJson('/api/v1/study-sessions', [
                'study_group_id' => $group->id,
                'title' => 'Test Study Session',
                'description' => 'Session automated test.',
                'meeting_link' => 'https://meet.google.com/test-room',
                'max_participants' => 10,
                'scheduled_at' => '2030-01-15 19:00:00',
                'duration_minutes' => 60,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Sesi belajar berhasil dibuat.'
            )
            ->assertJsonPath(
                'data.title',
                'Test Study Session'
            )
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'title',
                    'study_group_id',
                    'host_id',
                    'subject_id',
                    'meeting_link',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('study_sessions', [
            'study_group_id' => $group->id,
            'host_id' => $creator->id,
            'title' => 'Test Study Session',
            'status' => 'scheduled',
        ]);
    }

    public function test_regular_group_member_cannot_create_study_session(): void
    {
        $creator = User::factory()->create();
        $member = User::factory()->create();

        $group = $this->createGroup($creator);

        $group->members()->create([
            'user_id' => $member->id,
            'role' => 'member',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        $response = $this
            ->actingAs($member, 'sanctum')
            ->postJson('/api/v1/study-sessions', [
                'study_group_id' => $group->id,
                'title' => 'Member Session',
                'description' => 'Member biasa tidak boleh membuat sesi.',
                'meeting_link' => 'https://meet.google.com/member-test',
                'max_participants' => 10,
                'scheduled_at' => '2030-01-15 19:00:00',
                'duration_minutes' => 60,
            ]);

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Hanya ketua grup yang dapat membuat sesi belajar.'
            );

        $this->assertDatabaseMissing('study_sessions', [
            'title' => 'Member Session',
        ]);
    }

    public function test_non_member_cannot_create_study_session(): void
    {
        $creator = User::factory()->create();
        $outsider = User::factory()->create();

        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($outsider, 'sanctum')
            ->postJson('/api/v1/study-sessions', [
                'study_group_id' => $group->id,
                'title' => 'Unauthorized Session',
                'description' => 'Should be rejected.',
                'meeting_link' => 'https://meet.google.com/test-room',
                'max_participants' => 10,
                'scheduled_at' => '2030-01-15 19:00:00',
                'duration_minutes' => 60,
            ]);

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Hanya ketua grup yang dapat membuat sesi belajar.'
            );

        $this->assertDatabaseMissing('study_sessions', [
            'title' => 'Unauthorized Session',
        ]);
    }

    public function test_authenticated_user_can_upload_material(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->create(
            'materi-test.pdf',
            100,
            'application/pdf'
        );

        $response = $this
            ->actingAs($user, 'sanctum')
            ->post('/api/v1/materials', [
                'title' => 'Materi Automated Test',
                'description' => 'Materi untuk testing upload.',
                'subject' => 'Basis Data',
                'file' => $file,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Materi berhasil diunggah!'
            )
            ->assertJsonStructure([
                'message',
                'material' => [
                    'id',
                    'user_id',
                    'title',
                    'description',
                    'subject',
                    'file_path',
                    'file_type',
                    'file_size',
                ],
            ]);

        $this->assertDatabaseHas('materials', [
            'user_id' => $user->id,
            'title' => 'Materi Automated Test',
            'subject' => 'Basis Data',
            'file_type' => 'pdf',
        ]);

        Storage::disk('public')->assertExists(
            $response->json('material.file_path')
        );
    }

    public function test_material_upload_requires_a_file(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/v1/materials', [
                'title' => 'Materi Tanpa File',
                'description' => 'Test validation.',
                'subject' => 'Basis Data',
            ]);

        $response->assertUnprocessable();

        $response->assertJsonValidationErrors([
            'file',
        ]);
    }

    public function test_authenticated_user_can_report_material(): void
    {
        $owner = User::factory()->create();
        $reporter = User::factory()->create();

        $material = Material::create([
            'user_id' => $owner->id,
            'title' => 'Materi Test Report',
            'description' => 'Materi untuk automated test.',
            'subject' => 'Basis Data',
            'file_path' => 'materials/test-report.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
        ]);

        $response = $this
            ->actingAs($reporter, 'sanctum')
            ->postJson(
                "/api/v1/materials/{$material->id}/reports",
                [
                    'reason' => 'Materi ini memiliki informasi yang perlu diperiksa.',
                ]
            );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Laporan materi berhasil dikirim.'
            )
            ->assertJsonPath('data.material_id', $material->id)
            ->assertJsonPath('data.reporter_id', $reporter->id)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('material_reports', [
            'material_id' => $material->id,
            'reporter_id' => $reporter->id,
            'status' => 'pending',
        ]);
    }

    public function test_duplicate_pending_material_report_is_rejected(): void
    {
        $owner = User::factory()->create();
        $reporter = User::factory()->create();

        $material = Material::create([
            'user_id' => $owner->id,
            'title' => 'Materi Duplicate Report',
            'description' => 'Materi untuk duplicate report test.',
            'subject' => 'Pemrograman Web',
            'file_path' => 'materials/duplicate-report.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
        ]);

        $payload = [
            'reason' => 'Materi ini perlu diperiksa oleh moderator.',
        ];

        $this
            ->actingAs($reporter, 'sanctum')
            ->postJson(
                "/api/v1/materials/{$material->id}/reports",
                $payload
            )
            ->assertCreated();

        $response = $this
            ->actingAs($reporter, 'sanctum')
            ->postJson(
                "/api/v1/materials/{$material->id}/reports",
                $payload
            );

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Anda sudah memiliki laporan yang masih menunggu review untuk materi ini.'
            );
    }

    public function test_tutoring_review_requires_completed_request(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();

        $profile = TutorProfile::create([
            'user_id' => $tutor->id,
            'bio' => 'Tutor untuk automated test.',
            'hourly_rate' => 0,
            'is_verified' => false,
            'status' => 'active',
            'rating_avg' => 0,
            'reviews_count' => 0,
        ]);

        $tutoringRequest = TutoringRequest::create([
            'student_id' => $student->id,
            'tutor_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'topic' => 'Belajar Basis Data',
            'notes' => null,
            'scheduled_at' => now()->addDay(),
            'duration_minutes' => 60,
            'status' => 'accepted',
            'meeting_link' => null,
        ]);

        $response = $this
            ->actingAs($student, 'sanctum')
            ->postJson(
                "/api/v1/tutoring/requests/{$tutoringRequest->id}/reviews",
                [
                    'rating' => 5,
                    'comment' => 'Tutor menjelaskan materi dengan baik.',
                ]
            );

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Review hanya dapat diberikan setelah sesi tutoring selesai.'
            );
    }

    public function test_student_can_review_completed_tutoring(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();

        $profile = TutorProfile::create([
            'user_id' => $tutor->id,
            'bio' => 'Tutor untuk review test.',
            'hourly_rate' => 0,
            'is_verified' => false,
            'status' => 'active',
            'rating_avg' => 0,
            'reviews_count' => 0,
        ]);

        $tutoringRequest = TutoringRequest::create([
            'student_id' => $student->id,
            'tutor_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'topic' => 'Belajar Laravel',
            'notes' => null,
            'scheduled_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'meeting_link' => null,
        ]);

        $response = $this
            ->actingAs($student, 'sanctum')
            ->postJson(
                "/api/v1/tutoring/requests/{$tutoringRequest->id}/reviews",
                [
                    'rating' => 5,
                    'comment' => 'Penjelasannya sangat mudah dipahami.',
                ]
            );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Review tutoring berhasil dikirim.'
            )
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath(
                'data.tutoring_request_id',
                $tutoringRequest->id
            );

        $this->assertDatabaseHas('tutoring_reviews', [
            'tutoring_request_id' => $tutoringRequest->id,
            'student_id' => $student->id,
            'tutor_profile_id' => $profile->id,
            'rating' => 5,
        ]);

        $profile->refresh();

        $this->assertSame(1, $profile->reviews_count);
        $this->assertSame('5.00', $profile->rating_avg);
    }

    public function test_completed_tutoring_cannot_be_reviewed_twice(): void
    {
        $student = User::factory()->create();
        $tutor = User::factory()->create();
        $subject = $this->createSubject();

        $profile = TutorProfile::create([
            'user_id' => $tutor->id,
            'bio' => 'Tutor duplicate review test.',
            'hourly_rate' => 0,
            'is_verified' => false,
            'status' => 'active',
            'rating_avg' => 0,
            'reviews_count' => 0,
        ]);

        $tutoringRequest = TutoringRequest::create([
            'student_id' => $student->id,
            'tutor_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'topic' => 'Belajar Algoritma',
            'notes' => null,
            'scheduled_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'meeting_link' => null,
        ]);

        $payload = [
            'rating' => 4,
            'comment' => 'Sesi tutoring berjalan dengan baik.',
        ];

        $this
            ->actingAs($student, 'sanctum')
            ->postJson(
                "/api/v1/tutoring/requests/{$tutoringRequest->id}/reviews",
                $payload
            )
            ->assertCreated();

        $response = $this
            ->actingAs($student, 'sanctum')
            ->postJson(
                "/api/v1/tutoring/requests/{$tutoringRequest->id}/reviews",
                $payload
            );

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Sesi tutoring ini sudah pernah direview.'
            );

        $this->assertDatabaseCount('tutoring_reviews', 1);
    }
}