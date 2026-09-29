<?php

namespace Tests\Feature;

use App\Models\StudyGroup;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    private function createSubject(): Subject
    {
        return Subject::create([
            'code' =>
                'NOTIF' .
                fake()->unique()->numberBetween(100, 999),

            'name' =>
                'Notification Subject ' .
                fake()->unique()->numberBetween(100, 999),

            'slug' =>
                'notification-subject-' .
                fake()->unique()->numberBetween(100, 999),
        ]);
    }

    private function createGroup(
        User $owner,
        bool $private = false
    ): StudyGroup {
        $subject = $this->createSubject();

        $group = StudyGroup::create([
            'creator_id' => $owner->id,
            'subject_id' => $subject->id,
            'name' => 'Notification Test Group',
            'slug' =>
                'notification-test-group-' .
                fake()->unique()->numberBetween(1000, 9999),
            'description' =>
                'Group untuk pengujian notifikasi.',
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

    private function createNotification(
        User $user,
        string $title = 'Test Notification',
        string $type = 'system',
        ?string $id = null
    ): string {
        $id ??= (string) Str::uuid();

        DB::table('notifications')->insert([
            'id' => $id,
            'type' => $type,
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode([
                'title' => $title,
                'message' =>
                    'Pesan notification test.',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_user_can_list_own_notifications_and_unread_count_is_not_limited_to_fifty(): void
    {
        $user = User::factory()->create();

        for ($i = 1; $i <= 60; $i++) {
            $this->createNotification(
                $user,
                "Notification {$i}"
            );
        }

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response
            ->assertOk()
            ->assertJsonPath(
                'unread_count',
                60
            )
            ->assertJsonCount(
                50,
                'notifications'
            );
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();

        $notificationId =
            $this->createNotification($user);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->patchJson(
                "/api/v1/notifications/{$notificationId}/read"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Notifikasi ditandai sudah dibaca.'
            );

        $this->assertNotNull(
            DB::table('notifications')
                ->where(
                    'id',
                    $notificationId
                )
                ->value('read_at')
        );
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $notificationId =
            $this->createNotification($owner);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->patchJson(
                "/api/v1/notifications/{$notificationId}/read"
            );

        $response
            ->assertNotFound()
            ->assertJsonPath(
                'message',
                'Notifikasi tidak ditemukan.'
            );

        $this->assertNull(
            DB::table('notifications')
                ->where(
                    'id',
                    $notificationId
                )
                ->value('read_at')
        );
    }

    public function test_user_can_mark_all_own_notifications_as_read_without_affecting_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $first = $this->createNotification(
            $user,
            'Notification 1'
        );

        $second = $this->createNotification(
            $user,
            'Notification 2'
        );

        $other = $this->createNotification(
            $otherUser,
            'Other Notification'
        );

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson(
                '/api/v1/notifications/read-all'
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Semua notifikasi sudah dibaca.'
            );

        $this->assertNotNull(
            DB::table('notifications')
                ->where('id', $first)
                ->value('read_at')
        );

        $this->assertNotNull(
            DB::table('notifications')
                ->where('id', $second)
                ->value('read_at')
        );

        $this->assertNull(
            DB::table('notifications')
                ->where('id', $other)
                ->value('read_at')
        );
    }

    public function test_group_approval_creates_notification_for_member(): void
    {
        $owner = User::factory()->create();
        $memberUser = User::factory()->create();

        $group = $this->createGroup(
            $owner,
            true
        );

        $member = $group->members()->create([
            'user_id' => $memberUser->id,
            'role' => 'member',
            'status' => 'pending',
            'joined_at' => null,
        ]);

        $response = $this
            ->actingAs($owner, 'sanctum')
            ->patchJson(
                "/api/v1/groups/{$group->id}/members/{$member->id}/status",
                [
                    'status' => 'accepted',
                ]
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.status',
                'accepted'
            );

        $notification = DB::table(
            'notifications'
        )
            ->where(
                'notifiable_id',
                $memberUser->id
            )
            ->where(
                'type',
                'group'
            )
            ->first();

        $this->assertNotNull(
            $notification
        );

        $data = json_decode(
            $notification->data,
            true
        );

        $this->assertSame(
            'accepted',
            $data['status']
        );

        $this->assertSame(
            $group->id,
            $data['group_id']
        );
    }

    public function test_group_rejection_creates_notification_for_member(): void
    {
        $owner = User::factory()->create();
        $memberUser = User::factory()->create();

        $group = $this->createGroup(
            $owner,
            true
        );

        $member = $group->members()->create([
            'user_id' => $memberUser->id,
            'role' => 'member',
            'status' => 'pending',
            'joined_at' => null,
        ]);

        $response = $this
            ->actingAs($owner, 'sanctum')
            ->patchJson(
                "/api/v1/groups/{$group->id}/members/{$member->id}/status",
                [
                    'status' => 'rejected',
                ]
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.status',
                'rejected'
            );

        $notification = DB::table(
            'notifications'
        )
            ->where(
                'notifiable_id',
                $memberUser->id
            )
            ->where(
                'type',
                'group'
            )
            ->first();

        $this->assertNotNull(
            $notification
        );

        $data = json_decode(
            $notification->data,
            true
        );

        $this->assertSame(
            'rejected',
            $data['status']
        );

        $this->assertSame(
            $group->id,
            $data['group_id']
        );
    }

    public function test_new_study_session_notifies_accepted_members_except_host(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = $this->createGroup(
            $owner
        );

        $group->members()->create([
            'user_id' => $member->id,
            'role' => 'member',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        $response = $this
            ->actingAs($owner, 'sanctum')
            ->postJson(
                '/api/v1/study-sessions',
                [
                    'study_group_id' =>
                        $group->id,
                    'title' =>
                        'Notification Session',
                    'description' =>
                        'Session notification test.',
                    'meeting_link' =>
                        'https://meet.google.com/notification-test',
                    'max_participants' => 10,
                    'scheduled_at' =>
                        '2030-02-10 19:00:00',
                    'duration_minutes' => 60,
                ]
            );

        $response->assertCreated();

        $sessionId =
            $response->json('data.id');

        $memberNotification =
            DB::table('notifications')
                ->where(
                    'notifiable_id',
                    $member->id
                )
                ->where(
                    'type',
                    'session'
                )
                ->first();

        $this->assertNotNull(
            $memberNotification
        );

        $data = json_decode(
            $memberNotification->data,
            true
        );

        $this->assertSame(
            $sessionId,
            $data['session_id']
        );

        $this->assertSame(
            $group->id,
            $data['group_id']
        );

        $this->assertDatabaseMissing(
            'notifications',
            [
                'notifiable_type' =>
                    User::class,
                'notifiable_id' =>
                    $owner->id,
                'type' => 'session',
            ]
        );
    }
    public function test_private_group_join_request_notifies_group_creator(): void
{
    $owner = User::factory()->create([
        'name' => 'User A',
    ]);

    $requester = User::factory()->create([
        'name' => 'User B',
    ]);

    $group = $this->createGroup(
        $owner,
        true
    );

    $response = $this
        ->actingAs($requester, 'sanctum')
        ->postJson(
            "/api/v1/groups/{$group->id}/toggle-join"
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'joined',
            false
        )
        ->assertJsonPath(
            'status',
            'pending'
        )
        ->assertJsonPath(
            'message',
            'Permintaan bergabung berhasil dikirim.'
        );

    $membership = DB::table(
        'group_members'
    )
        ->where(
            'study_group_id',
            $group->id
        )
        ->where(
            'user_id',
            $requester->id
        )
        ->first();

    $this->assertNotNull(
        $membership
    );

    $this->assertSame(
        'pending',
        $membership->status
    );

    $notification = DB::table(
        'notifications'
    )
        ->where(
            'notifiable_type',
            User::class
        )
        ->where(
            'notifiable_id',
            $owner->id
        )
        ->where(
            'type',
            'group'
        )
        ->first();

    $this->assertNotNull(
        $notification
    );

    $data = json_decode(
        $notification->data,
        true
    );

    $this->assertSame(
        'Permintaan bergabung baru',
        $data['title']
    );

    $this->assertSame(
        'User B ingin bergabung ke grup Notification Test Group.',
        $data['message']
    );

    $this->assertSame(
        $group->id,
        $data['group_id']
    );

    $this->assertSame(
        $membership->id,
        $data['member_id']
    );

    $this->assertSame(
        $requester->id,
        $data['requester_id']
    );

    $this->assertSame(
        'User B',
        $data['requester_name']
    );

    $this->assertSame(
        'pending',
        $data['status']
    );

    /*
     * Requester tidak boleh menerima
     * notifikasi request miliknya sendiri.
     */
    $this->assertDatabaseMissing(
        'notifications',
        [
            'notifiable_type' =>
                User::class,
            'notifiable_id' =>
                $requester->id,
            'type' =>
                'group',
        ]
    );
  }
}