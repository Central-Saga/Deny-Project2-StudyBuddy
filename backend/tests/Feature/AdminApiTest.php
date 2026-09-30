<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\MaterialReport;
use App\Models\StudyGroup;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\TutorProfile;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Membuat administrator sistem.
     */
    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'name' => 'System Admin',
            'email' => 'admin-test@example.com',
        ]);

        $admin->role = User::ROLE_ADMIN;
        $admin->account_status = User::STATUS_ACTIVE;
        $admin->save();

        return $admin->refresh();
    }

    /**
     * Membuat user biasa.
     */
    private function createUser(
        string $name = 'Regular User',
        string $email = 'regular@example.com'
    ): User {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
        ]);

        $user->role = User::ROLE_USER;
        $user->account_status = User::STATUS_ACTIVE;
        $user->save();

        return $user->refresh();
    }

    /**
     * Membuat subject untuk kebutuhan group.
     */
    private function createSubject(): Subject
    {
        return Subject::create([
            'code' =>
                'ADMIN' .
                fake()->unique()->numberBetween(100, 999),

            'name' =>
                'Admin Test Subject ' .
                fake()->unique()->numberBetween(100, 999),

            'slug' =>
                'admin-test-subject-' .
                fake()->unique()->numberBetween(100, 999),
        ]);
    }

    /**
     * Membuat study group.
     */
    private function createGroup(
        User $owner,
        bool $private = false
    ): StudyGroup {
        $subject = $this->createSubject();

        $group = StudyGroup::create([
            'creator_id' => $owner->id,
            'subject_id' => $subject->id,
            'name' => 'Admin Test Group',
            'slug' =>
                'admin-test-group-' .
                fake()->unique()->numberBetween(1000, 9999),
            'description' =>
                'Group untuk pengujian admin.',
            'max_members' => 10,
            'is_private' => $private,
        ]);

        $group->members()->create([
            'user_id' => $owner->id,
            'role' => 'admin',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        return $group;
    }

    /**
     * Membuat laporan material pending.
     */
    private function createMaterialReport(
        User $owner,
        User $reporter
    ): MaterialReport {
        $material = Material::create([
            'user_id' => $owner->id,
            'title' => 'Admin Test Material',
            'description' =>
                'Material untuk pengujian moderasi admin.',
            'subject' => 'Pemrograman Web',
            'file_path' => 'materials/admin-test.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        return MaterialReport::create([
            'material_id' => $material->id,
            'reporter_id' => $reporter->id,
            'reason' =>
                'Material ini dilaporkan untuk kebutuhan test.',
            'status' => 'pending',
        ]);
    }

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $response = $this->getJson(
            '/api/v1/admin/dashboard'
        );

        $response->assertUnauthorized();
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        $user = $this->createUser();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Akses ditolak. Administrator diperlukan.'
            );
    }

    public function test_admin_can_access_dashboard_and_view_statistics(): void
    {
        $admin = $this->createAdmin();

        $activeUser = $this->createUser(
            'Active User',
            'active@example.com'
        );

        $suspendedUser = $this->createUser(
            'Suspended User',
            'suspended@example.com'
        );

        $suspendedUser->account_status =
            User::STATUS_SUSPENDED;

        $suspendedUser->save();

        $this->createGroup($activeUser);

        $this->createMaterialReport(
            $activeUser,
            $suspendedUser
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath(
                'stats.total_users',
                2
            )
            ->assertJsonPath(
                'stats.active_users',
                1
            )
            ->assertJsonPath(
                'stats.suspended_users',
                1
            )
            ->assertJsonPath(
                'stats.total_groups',
                1
            )
            ->assertJsonPath(
                'stats.total_materials',
                1
            )
            ->assertJsonPath(
                'stats.total_material_reports',
                1
            )
            ->assertJsonPath(
                'stats.pending_material_reports',
                1
            )
            ->assertJsonStructure([
                'stats' => [
                    'total_users',
                    'active_users',
                    'suspended_users',
                    'total_groups',
                    'total_sessions',
                    'total_materials',
                    'total_quizzes',
                    'published_quizzes',
                    'total_tutors',
                    'verified_tutors',
                    'total_material_reports',
                    'pending_material_reports',
                ],
            ]);
    }

    public function test_admin_can_list_regular_users(): void
    {
        $admin = $this->createAdmin();

        $firstUser = $this->createUser(
            'User One',
            'user-one@example.com'
        );

        $secondUser = $this->createUser(
            'User Two',
            'user-two@example.com'
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users');

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Daftar user berhasil diambil.'
            )
            ->assertJsonCount(2, 'data');

        $ids = collect(
            $response->json('data')
        )->pluck('id');

        $this->assertTrue(
            $ids->contains($firstUser->id)
        );

        $this->assertTrue(
            $ids->contains($secondUser->id)
        );

        $this->assertFalse(
            $ids->contains($admin->id)
        );
    }

    public function test_admin_can_view_regular_user_detail(): void
    {
        $admin = $this->createAdmin();

        $user = $this->createUser(
            'Detail User',
            'detail@example.com'
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/admin/users/{$user->id}"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $user->id
            )
            ->assertJsonPath(
                'data.email',
                'detail@example.com'
            )
            ->assertJsonPath(
                'data.role',
                User::ROLE_USER
            )
            ->assertJsonPath(
                'data.account_status',
                User::STATUS_ACTIVE
            );
    }

    public function test_admin_can_suspend_and_reactivate_user(): void
    {
        $admin = $this->createAdmin();

        $user = $this->createUser(
            'Suspend User',
            'suspend@example.com'
        );

        $suspendResponse = $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/admin/users/{$user->id}/status",
                [
                    'account_status' =>
                        User::STATUS_SUSPENDED,
                ]
            );

        $suspendResponse
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Akun user berhasil ditangguhkan.'
            )
            ->assertJsonPath(
                'data.account_status',
                User::STATUS_SUSPENDED
            );

        $this->assertDatabaseHas(
            'users',
            [
                'id' => $user->id,
                'account_status' =>
                    User::STATUS_SUSPENDED,
            ]
        );

        $activateResponse = $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/admin/users/{$user->id}/status",
                [
                    'account_status' =>
                        User::STATUS_ACTIVE,
                ]
            );

        $activateResponse
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Akun user berhasil diaktifkan.'
            )
            ->assertJsonPath(
                'data.account_status',
                User::STATUS_ACTIVE
            );

        $this->assertDatabaseHas(
            'users',
            [
                'id' => $user->id,
                'account_status' =>
                    User::STATUS_ACTIVE,
            ]
        );
    }

    public function test_admin_cannot_change_another_admin_status_through_user_endpoint(): void
    {
        $admin = $this->createAdmin();

        $otherAdmin = User::factory()->create([
            'email' =>
                'other-admin@example.com',
        ]);

        $otherAdmin->role =
            User::ROLE_ADMIN;

        $otherAdmin->account_status =
            User::STATUS_ACTIVE;

        $otherAdmin->save();

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/admin/users/{$otherAdmin->id}/status",
                [
                    'account_status' =>
                        User::STATUS_SUSPENDED,
                ]
            );

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Status akun administrator tidak dapat diubah melalui endpoint ini.'
            );

        $this->assertDatabaseHas(
            'users',
            [
                'id' => $otherAdmin->id,
                'account_status' =>
                    User::STATUS_ACTIVE,
            ]
        );
    }

    public function test_admin_can_list_groups(): void
    {
        $admin = $this->createAdmin();

        $owner = $this->createUser(
            'Group Owner',
            'group-owner@example.com'
        );

        $group = $this->createGroup(
            $owner,
            true
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/groups');

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Daftar study group berhasil diambil.'
            )
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $group->id
            )
            ->assertJsonPath(
                'data.0.privacy',
                'private'
            )
            ->assertJsonPath(
                'data.0.member_stats.accepted',
                1
            )
            ->assertJsonPath(
                'data.0.member_stats.group_admins',
                1
            );
    }

    public function test_admin_can_view_group_detail(): void
    {
        $admin = $this->createAdmin();

        $owner = $this->createUser(
            'Detail Group Owner',
            'detail-group-owner@example.com'
        );

        $group = $this->createGroup($owner);

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/admin/groups/{$group->id}"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $group->id
            )
            ->assertJsonPath(
                'data.creator.id',
                $owner->id
            )
            ->assertJsonPath(
                'data.member_stats.accepted',
                1
            )
            ->assertJsonCount(
                1,
                'data.members'
            );
    }

    public function test_admin_can_list_material_reports(): void
    {
        $admin = $this->createAdmin();

        $owner = $this->createUser(
            'Material Owner',
            'material-owner@example.com'
        );

        $reporter = $this->createUser(
            'Material Reporter',
            'material-reporter@example.com'
        );

        $report = $this->createMaterialReport(
            $owner,
            $reporter
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson(
                '/api/v1/admin/material-reports'
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Daftar laporan material berhasil diambil.'
            )
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $report->id
            )
            ->assertJsonPath(
                'data.0.status',
                'pending'
            )
            ->assertJsonPath(
                'data.0.reporter.id',
                $reporter->id
            );
    }

    public function test_admin_can_update_material_report_status(): void
    {
        $admin = $this->createAdmin();

        $owner = $this->createUser(
            'Report Owner',
            'report-owner@example.com'
        );

        $reporter = $this->createUser(
            'Report User',
            'report-user@example.com'
        );

        $report = $this->createMaterialReport(
            $owner,
            $reporter
        );

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/admin/material-reports/{$report->id}",
                [
                    'status' => 'reviewed',
                ]
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Status laporan material berhasil diperbarui.'
            )
            ->assertJsonPath(
                'data.status',
                'reviewed'
            );

        $this->assertDatabaseHas(
            'material_reports',
            [
                'id' => $report->id,
                'status' => 'reviewed',
            ]
        );
    }

    public function test_suspended_user_cannot_access_protected_endpoint(): void
    {
        $user = $this->createUser(
            'Suspended Protected User',
            'protected-suspended@example.com'
        );

        $user->account_status =
            User::STATUS_SUSPENDED;

        $user->save();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/v1/me');

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Akun Anda sedang ditangguhkan.'
            );
    }
    public function test_regular_user_cannot_access_admin_tutors(): void
{
    $user = User::factory()->create([
        'role' => User::ROLE_USER,
        'account_status' => User::STATUS_ACTIVE,
    ]);

    $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/v1/admin/tutors')
        ->assertForbidden();
}

public function test_admin_can_list_tutors(): void
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'account_status' => User::STATUS_ACTIVE,
    ]);

    $tutorUser = User::factory()->create([
        'name' => 'Tutor Laravel',
        'email' => 'tutor-laravel@example.com',
    ]);

    TutorProfile::create([
        'user_id' => $tutorUser->id,
        'bio' => 'Tutor Laravel untuk automated test.',
        'hourly_rate' => 0,
        'is_verified' => false,
        'status' => 'active',
        'rating_avg' => 0,
        'reviews_count' => 0,
    ]);

    $response = $this
        ->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/tutors');

    $response
        ->assertOk()
        ->assertJsonPath(
            'message',
            'Daftar tutor berhasil diambil.'
        )
        ->assertJsonPath(
            'data.0.name',
            'Tutor Laravel'
        )
        ->assertJsonPath(
            'data.0.is_verified',
            false
        );
}

public function test_admin_can_view_tutor_detail(): void
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'account_status' => User::STATUS_ACTIVE,
    ]);

    $tutorUser = User::factory()->create([
        'name' => 'Tutor Detail',
        'email' => 'tutor-detail@example.com',
    ]);

    $tutorProfile = TutorProfile::create([
        'user_id' => $tutorUser->id,
        'bio' => 'Profil tutor untuk detail test.',
        'hourly_rate' => 0,
        'is_verified' => false,
        'status' => 'active',
        'rating_avg' => 4.5,
        'reviews_count' => 2,
    ]);

    $response = $this
        ->actingAs($admin, 'sanctum')
        ->getJson(
            "/api/v1/admin/tutors/{$tutorProfile->id}"
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'message',
            'Detail tutor berhasil diambil.'
        )
        ->assertJsonPath(
            'data.id',
            $tutorProfile->id
        )
        ->assertJsonPath(
            'data.name',
            'Tutor Detail'
        )
        ->assertJsonPath(
            'data.email',
            'tutor-detail@example.com'
        )
        ->assertJsonPath(
            'data.is_verified',
            false
        );
}

public function test_admin_can_verify_and_unverify_tutor(): void
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'account_status' => User::STATUS_ACTIVE,
    ]);

    $tutorUser = User::factory()->create();

    $tutorProfile = TutorProfile::create([
        'user_id' => $tutorUser->id,
        'bio' => 'Tutor verification test.',
        'hourly_rate' => 0,
        'is_verified' => false,
        'status' => 'active',
        'rating_avg' => 0,
        'reviews_count' => 0,
    ]);

    $verifyResponse = $this
        ->actingAs($admin, 'sanctum')
        ->patchJson(
            "/api/v1/admin/tutors/{$tutorProfile->id}/verification",
            [
                'is_verified' => true,
            ]
        );

    $verifyResponse
        ->assertOk()
        ->assertJsonPath(
            'message',
            'Tutor berhasil diverifikasi.'
        )
        ->assertJsonPath(
            'data.is_verified',
            true
        )
        ->assertJsonPath(
            'data.verified_by',
            $admin->id
        );

    $this->assertDatabaseHas(
        'tutor_profiles',
        [
            'id' => $tutorProfile->id,
            'is_verified' => true,
            'verified_by' => $admin->id,
        ]
    );

    $this->assertNotNull(
        $tutorProfile
            ->fresh()
            ->verified_at
    );

    $unverifyResponse = $this
        ->actingAs($admin, 'sanctum')
        ->patchJson(
            "/api/v1/admin/tutors/{$tutorProfile->id}/verification",
            [
                'is_verified' => false,
            ]
        );

    $unverifyResponse
        ->assertOk()
        ->assertJsonPath(
            'message',
            'Verifikasi tutor berhasil dibatalkan.'
        )
        ->assertJsonPath(
            'data.is_verified',
            false
        )
        ->assertJsonPath(
            'data.verified_by',
            null
        )
        ->assertJsonPath(
            'data.verified_at',
            null
        );

    $this->assertDatabaseHas(
        'tutor_profiles',
        [
            'id' => $tutorProfile->id,
            'is_verified' => false,
            'verified_by' => null,
            'verified_at' => null,
        ]
    );
  }
}