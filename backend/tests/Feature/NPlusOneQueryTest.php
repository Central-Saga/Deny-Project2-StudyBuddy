<?php

namespace Tests\Feature;

use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NPlusOneQueryTest extends TestCase
{
    use RefreshDatabase;

    private function createGroup(
        User $viewer,
        int $number
    ): StudyGroup {
        $creator = User::factory()->create();

        $subject = Subject::create([
            'code' => 'NQ' . $number,
            'name' => 'N+1 Subject ' . $number,
            'slug' => 'n-plus-one-subject-' . $number,
        ]);

        $group = StudyGroup::create([
            'creator_id' => $creator->id,
            'subject_id' => $subject->id,
            'name' => 'N+1 Group ' . $number,
            'slug' => 'n-plus-one-group-' . $number,
            'description' => 'N+1 query testing.',
            'max_members' => 20,
            'is_private' => false,
        ]);

        $group->members()->create([
            'user_id' => $creator->id,
            'role' => 'admin',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        $group->members()->create([
            'user_id' => $viewer->id,
            'role' => 'member',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        return $group;
    }

    private function createSession(
        User $viewer,
        int $number
    ): void {
        $group = $this->createGroup($viewer, $number);

        $session = StudySession::create([
            'host_id' => $group->creator_id,
            'study_group_id' => $group->id,
            'subject_id' => $group->subject_id,
            'title' => 'N+1 Session ' . $number,
            'description' => 'Query testing.',
            'max_participants' => 10,
            'scheduled_at' => '2030-01-15 19:00:00',
            'duration_minutes' => 60,
            'status' => 'scheduled',
        ]);

        $session->participants()->create([
            'user_id' => $group->creator_id,
            'role' => 'host',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);
    }

    private function queryCount(
        string $url,
        int $expectedItems
    ): int {
        DB::enableQueryLog();
        DB::flushQueryLog();

        try {
            $this->getJson($url)
                ->assertOk()
                ->assertJsonCount($expectedItems, 'data');

            return count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }
    }

    public function test_group_list_has_no_n_plus_one(): void
    {
        $viewer = User::factory()->create();

        $this->actingAs($viewer, 'sanctum');

        $this->createGroup($viewer, 1);

        $small = $this->queryCount(
            '/api/v1/groups',
            1
        );

        for ($i = 2; $i <= 6; $i++) {
            $this->createGroup($viewer, $i);
        }

        $large = $this->queryCount(
            '/api/v1/groups',
            6
        );

        $this->assertLessThanOrEqual(
            $small + 1,
            $large,
            "Potential N+1 in group list: {$small} vs {$large} queries."
        );
    }

    public function test_group_detail_has_no_n_plus_one(): void
    {
        $viewer = User::factory()->create();

        $group = $this->createGroup($viewer, 1);

        $this->actingAs($viewer, 'sanctum');

        $url = "/api/v1/groups/{$group->id}";

        DB::enableQueryLog();
        DB::flushQueryLog();

        try {
            $this->getJson($url)
                ->assertOk()
                ->assertJsonCount(2, 'data.members');

            $small = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }

        for ($i = 1; $i <= 5; $i++) {
            $member = User::factory()->create();

            $group->members()->create([
                'user_id' => $member->id,
                'role' => 'member',
                'status' => 'accepted',
                'joined_at' => now(),
            ]);
        }

        DB::enableQueryLog();
        DB::flushQueryLog();

        try {
            $this->getJson($url)
                ->assertOk()
                ->assertJsonCount(7, 'data.members');

            $large = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }

        $this->assertLessThanOrEqual(
            $small + 1,
            $large,
            "Potential N+1 in group detail: {$small} vs {$large} queries."
        );
    }

    public function test_session_list_has_no_n_plus_one(): void
    {
        $viewer = User::factory()->create();

        $this->actingAs($viewer, 'sanctum');

        $this->createSession($viewer, 1);

        $small = $this->queryCount(
            '/api/v1/study-sessions',
            1
        );

        for ($i = 2; $i <= 6; $i++) {
            $this->createSession($viewer, $i);
        }

        $large = $this->queryCount(
            '/api/v1/study-sessions',
            6
        );

        $this->assertLessThanOrEqual(
            $small + 1,
            $large,
            "Potential N+1 in session list: {$small} vs {$large} queries."
        );
    }
}