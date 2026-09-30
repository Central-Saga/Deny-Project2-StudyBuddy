<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminQuizApiTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        $admin = User::factory()->create();

        $admin->role = 'admin';
        $admin->account_status = 'active';
        $admin->save();

        return $admin;
    }

    private function createQuiz(
        User $creator,
        bool $published = true
    ): int {
        $now = now();

        $quizId = DB::table('quizzes')
            ->insertGetId([
                'creator_id' => $creator->id,
                'subject_id' => null,
                'title' =>
                    'Admin Quiz Test ' .
                    fake()->unique()->numberBetween(
                        1000,
                        9999
                    ),
                'slug' =>
                    'admin-quiz-test-' .
                    fake()->unique()->numberBetween(
                        10000,
                        99999
                    ),
                'description' =>
                    'Quiz untuk automated test admin.',
                'duration_minutes' => 30,
                'max_attempts' => 3,
                'pass_score' => 70,
                'is_published' => $published,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

        $questionId = DB::table(
            'quiz_questions'
        )->insertGetId([
            'quiz_id' => $quizId,
            'question_text' =>
                'Manakah jawaban yang benar?',
            'question_type' =>
                'multiple_choice',
            'points' => 1,
            'order' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('quiz_options')->insert([
            [
                'quiz_question_id' =>
                    $questionId,
                'option_text' =>
                    'Jawaban Benar',
                'is_correct' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'quiz_question_id' =>
                    $questionId,
                'option_text' =>
                    'Jawaban Salah',
                'is_correct' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        return (int) $quizId;
    }

    public function test_regular_user_cannot_access_admin_quizzes(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson(
            '/api/v1/admin/quizzes'
        )->assertForbidden();
    }

    public function test_admin_can_list_published_and_unpublished_quizzes(): void
    {
        $admin = $this->createAdmin();
        $creator = User::factory()->create();

        $publishedQuizId =
            $this->createQuiz(
                $creator,
                true
            );

        $unpublishedQuizId =
            $this->createQuiz(
                $creator,
                false
            );

        Sanctum::actingAs($admin);

        $response = $this->getJson(
            '/api/v1/admin/quizzes'
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Daftar kuis berhasil diambil.'
            )
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'creator_id',
                        'title',
                        'is_published',
                        'is_admin_disabled',
                        'creator',
                        'subject',
                        'question_count',
                        'attempt_count',
                        'completed_attempt_count',
                    ],
                ],
            ]);

        $quizIds = collect(
            $response->json('data')
        )->pluck('id')->all();

        $this->assertContains(
            $publishedQuizId,
            $quizIds
        );

        $this->assertContains(
            $unpublishedQuizId,
            $quizIds
        );
    }

    public function test_admin_can_view_quiz_detail_with_correct_answers(): void
    {
        $admin = $this->createAdmin();
        $creator = User::factory()->create();

        $quizId = $this->createQuiz(
            $creator
        );

        Sanctum::actingAs($admin);

        $response = $this->getJson(
            "/api/v1/admin/quizzes/{$quizId}"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Detail kuis berhasil diambil.'
            )
            ->assertJsonPath(
                'data.id',
                $quizId
            )
            ->assertJsonPath(
                'data.creator.id',
                $creator->id
            )
            ->assertJsonPath(
                'data.question_count',
                1
            )
            ->assertJsonPath(
                'data.questions.0.options.0.is_correct',
                true
            )
            ->assertJsonPath(
                'data.questions.0.options.1.is_correct',
                false
            )
            ->assertJsonStructure([
                'data' => [
                    'attempt_summary' => [
                        'total',
                        'completed',
                        'in_progress',
                        'timed_out',
                        'average_score',
                    ],
                ],
            ]);
    }

    public function test_admin_can_disable_quiz_and_creator_cannot_republish_it(): void
    {
        $admin = $this->createAdmin();
        $creator = User::factory()->create();

        $quizId = $this->createQuiz(
            $creator,
            true
        );

        Sanctum::actingAs($admin);

        $this->postJson(
            "/api/v1/admin/quizzes/{$quizId}/disable",
            [
                'reason' =>
                    'Konten kuis perlu ditinjau oleh administrator.',
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Kuis berhasil dinonaktifkan oleh administrator.'
            )
            ->assertJsonPath(
                'data.is_admin_disabled',
                true
            );

        $this->assertDatabaseHas(
            'quizzes',
            [
                'id' => $quizId,
                'is_published' => false,
                'admin_disabled_by' =>
                    $admin->id,
                'admin_disabled_was_published' =>
                    true,
            ]
        );

        Sanctum::actingAs($creator);

        $this->putJson(
            "/api/v1/quizzes/{$quizId}",
            [
                'is_published' => true,
            ]
        )
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'Kuis sedang dinonaktifkan oleh administrator dan tidak dapat dipublikasikan kembali.'
            );

        $this->assertDatabaseHas(
            'quizzes',
            [
                'id' => $quizId,
                'is_published' => false,
                'admin_disabled_by' =>
                    $admin->id,
            ]
        );
    }

    public function test_admin_restore_returns_quiz_to_previous_publish_state(): void
    {
        $admin = $this->createAdmin();
        $creator = User::factory()->create();

        $publishedQuizId =
            $this->createQuiz(
                $creator,
                true
            );

        $unpublishedQuizId =
            $this->createQuiz(
                $creator,
                false
            );

        Sanctum::actingAs($admin);

        foreach (
            [
                $publishedQuizId,
                $unpublishedQuizId,
            ] as $quizId
        ) {
            $this->postJson(
                "/api/v1/admin/quizzes/{$quizId}/disable",
                [
                    'reason' =>
                        'Moderasi sementara untuk automated test.',
                ]
            )->assertOk();

            $this->postJson(
                "/api/v1/admin/quizzes/{$quizId}/restore"
            )
                ->assertOk()
                ->assertJsonPath(
                    'message',
                    'Moderasi kuis berhasil dipulihkan.'
                )
                ->assertJsonPath(
                    'data.is_admin_disabled',
                    false
                );
        }

        $this->assertDatabaseHas(
            'quizzes',
            [
                'id' => $publishedQuizId,
                'is_published' => true,
                'admin_disabled_at' => null,
                'admin_disabled_by' => null,
                'admin_disabled_reason' => null,
                'admin_disabled_was_published' =>
                    null,
            ]
        );

        $this->assertDatabaseHas(
            'quizzes',
            [
                'id' => $unpublishedQuizId,
                'is_published' => false,
                'admin_disabled_at' => null,
                'admin_disabled_by' => null,
                'admin_disabled_reason' => null,
                'admin_disabled_was_published' =>
                    null,
            ]
        );
    }
}