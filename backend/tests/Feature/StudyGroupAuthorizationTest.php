<?php

namespace Tests\Feature;

use App\Models\StudyGroup;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyGroupAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createGroup(User $creator): StudyGroup
    {
        $subject = Subject::create([
            'code' => 'ISS43',
            'name' => 'Issue 43 Subject',
            'slug' => 'issue-43-subject',
        ]);

        $group = StudyGroup::create([
            'creator_id' => $creator->id,
            'subject_id' => $subject->id,
            'name' => 'Original Study Group',
            'slug' => 'issue-43-group',
            'description' => 'Group untuk pengujian otorisasi.',
            'max_members' => 10,
            'is_private' => false,
        ]);

        $group->members()->create([
            'user_id' => $creator->id,
            'role' => 'admin',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        return $group;
    }

    public function test_invalid_group_input_returns_422(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/v1/groups', []);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'name',
                    'subject_id',
                    'max_members',
                ],
            ]);
    }

    public function test_creator_can_update_group(): void
    {
        $creator = User::factory()->create();
        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($creator, 'sanctum')
            ->putJson("/api/v1/groups/{$group->id}", [
                'name' => 'Updated Study Group',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.name',
                'Updated Study Group'
            );

        $this->assertDatabaseHas('study_groups', [
            'id' => $group->id,
            'name' => 'Updated Study Group',
        ]);
    }

    public function test_non_admin_cannot_update_group(): void
    {
        $creator = User::factory()->create();
        $otherUser = User::factory()->create();

        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->putJson("/api/v1/groups/{$group->id}", [
                'name' => 'Unauthorized Update',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('study_groups', [
            'id' => $group->id,
            'name' => 'Original Study Group',
        ]);
    }

    public function test_non_admin_cannot_delete_group(): void
    {
        $creator = User::factory()->create();
        $otherUser = User::factory()->create();

        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->deleteJson("/api/v1/groups/{$group->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('study_groups', [
            'id' => $group->id,
        ]);
    }

    public function test_regular_member_cannot_manage_members(): void
    {
        $creator = User::factory()->create();
        $regularMember = User::factory()->create();
        $pendingUser = User::factory()->create();

        $group = $this->createGroup($creator);

        $group->members()->create([
            'user_id' => $regularMember->id,
            'role' => 'member',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        $pendingMembership = $group->members()->create([
            'user_id' => $pendingUser->id,
            'role' => 'member',
            'status' => 'pending',
        ]);

        $response = $this
            ->actingAs($regularMember, 'sanctum')
            ->patchJson(
                "/api/v1/groups/{$group->id}/members/{$pendingMembership->id}/status",
                [
                    'status' => 'accepted',
                ]
            );

        $response->assertForbidden();

        $this->assertDatabaseHas('group_members', [
            'id' => $pendingMembership->id,
            'status' => 'pending',
        ]);
    }

    public function test_group_list_uses_data_resource(): void
    {
        $creator = User::factory()->create();
        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($creator, 'sanctum')
            ->getJson('/api/v1/groups');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $group->id)
            ->assertJsonPath('data.0.name', 'Original Study Group')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'creator_id',
                        'subject_id',
                        'members',
                    ],
                ],
            ]);
    }

    public function test_group_detail_uses_data_resource(): void
    {
        $creator = User::factory()->create();
        $group = $this->createGroup($creator);

        $response = $this
            ->actingAs($creator, 'sanctum')
            ->getJson("/api/v1/groups/{$group->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $group->id)
            ->assertJsonPath('data.name', 'Original Study Group')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'creator_id',
                    'subject_id',
                    'members',
                ],
            ]);
    }
}