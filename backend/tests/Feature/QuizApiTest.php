<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuizApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_quiz(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/quizzes', $this->quizPayload());

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Kuis berhasil dibuat.')
            ->assertJsonPath('data.creator_id', $user->id)
            ->assertJsonPath('data.title', 'Quiz Laravel Dasar')
            ->assertJsonPath('data.question_count', 1)
            ->assertJsonPath('data.can_manage', true);

        $quizId = $response->json('data.id');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quizId,
            'creator_id' => $user->id,
            'title' => 'Quiz Laravel Dasar',
            'is_published' => true,
        ]);

        $this->assertDatabaseCount('quiz_questions', 1);
        $this->assertDatabaseCount('quiz_options', 4);
    }

    public function test_quiz_creator_can_update_own_quiz(): void
    {
        $creator = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($creator);

        $response = $this->putJson('/api/v1/quizzes/' . $quiz['id'], [
            'title' => 'Quiz Laravel Lanjutan',
            'description' => 'Deskripsi sudah diperbarui.',
            'duration_minutes' => 45,
            'pass_score' => 80,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Kuis berhasil diperbarui.')
            ->assertJsonPath('data.title', 'Quiz Laravel Lanjutan')
            ->assertJsonPath('data.duration_minutes', 45)
            ->assertJsonPath('data.pass_score', 80);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz['id'],
            'title' => 'Quiz Laravel Lanjutan',
            'pass_score' => 80,
        ]);
    }

    public function test_other_user_cannot_update_quiz(): void
    {
        $creator = User::factory()->create();
        $otherUser = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($otherUser);

        $this->putJson('/api/v1/quizzes/' . $quiz['id'], [
            'title' => 'Diubah User Lain',
            'pass_score' => 50,
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Kamu hanya dapat mengedit kuis milikmu sendiri.');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz['id'],
            'title' => 'Quiz Laravel Dasar',
        ]);
    }

    public function test_quiz_creator_can_deactivate_quiz_and_it_disappears_from_active_list(): void
    {
        $creator = User::factory()->create();
        $viewer = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($creator);

        $this->deleteJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk()
            ->assertJsonPath('message', 'Kuis berhasil dinonaktifkan. Riwayat pengerjaan tetap disimpan.');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz['id'],
            'is_published' => false,
        ]);

        Sanctum::actingAs($viewer);
        $index = $this->getJson('/api/v1/quizzes')->assertOk();

        $activeQuizIds = collect($index->json())->pluck('id')->all();
        $this->assertNotContains($quiz['id'], $activeQuizIds);

        $this->getJson('/api/v1/quizzes/' . $quiz['id'])->assertNotFound();

        Sanctum::actingAs($creator);
        $this->getJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk()
            ->assertJsonPath('is_published', false)
            ->assertJsonPath('can_manage', true);
    }

    public function test_other_user_cannot_deactivate_quiz(): void
    {
        $creator = User::factory()->create();
        $otherUser = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($otherUser);

        $this->deleteJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Kamu hanya dapat menonaktifkan kuis milikmu sendiri.');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz['id'],
            'is_published' => true,
        ]);
    }

    public function test_questions_cannot_be_changed_after_quiz_has_attempt_but_metadata_can(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($student);
        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertCreated();

        Sanctum::actingAs($creator);

        $this->putJson('/api/v1/quizzes/' . $quiz['id'], [
            'title' => 'Quiz Laravel Dasar',
            'pass_score' => 70,
            'questions' => [
                [
                    'question_text' => 'Soal ini mencoba mengganti soal lama.',
                    'question_type' => 'multiple_choice',
                    'points' => 2,
                    'options' => [
                        ['option_text' => 'A', 'is_correct' => true],
                        ['option_text' => 'B', 'is_correct' => false],
                    ],
                ],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'Soal tidak dapat diubah karena kuis ini sudah memiliki riwayat percobaan. Kamu masih dapat mengubah judul, deskripsi, mata kuliah, durasi, nilai lulus, dan batas percobaan.'
            );

        $this->putJson('/api/v1/quizzes/' . $quiz['id'], [
            'title' => 'Quiz Laravel Dasar Revisi',
            'description' => 'Metadata tetap boleh berubah.',
            'duration_minutes' => 60,
            'pass_score' => 75,
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Quiz Laravel Dasar Revisi')
            ->assertJsonPath('data.pass_score', 75);

        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz['id'],
            'question_text' => 'Apa command untuk membuat project Laravel?',
        ]);
    }

    public function test_correct_answers_are_hidden_from_other_users_before_submission(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($student);
        $response = $this->getJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk();

        $studentOption = $response->json('questions.0.options.0');
        $this->assertIsArray($studentOption);
        $this->assertArrayNotHasKey('is_correct', $studentOption);

        Sanctum::actingAs($creator);
        $ownerResponse = $this->getJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk();

        $ownerOption = $ownerResponse->json('questions.0.options.0');
        $this->assertIsArray($ownerOption);
        $this->assertArrayHasKey('is_correct', $ownerOption);
    }


    public function test_creator_can_preview_correct_answers_without_creating_attempt(): void
    {
        $creator = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($creator);

        $response = $this->getJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk()
            ->assertJsonPath('can_manage', true)
            ->assertJsonPath('questions.0.options.0.is_correct', true);

        $this->assertDatabaseMissing('quiz_attempts', [
            'quiz_id' => $quiz['id'],
            'user_id' => $creator->id,
        ]);

        $this->assertSame(0, $response->json('attempts_used'));
    }

    public function test_new_quiz_rejects_essay_questions(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = $this->quizPayload();
        $payload['questions'] = [
            [
                'question_text' => 'Jelaskan Laravel.',
                'question_type' => 'essay',
                'points' => 2,
                'options' => [],
            ],
        ];

        $this->postJson('/api/v1/quizzes', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['questions.0.question_type']);
    }

    public function test_submit_returns_answer_review_with_correct_answer_after_submission(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        $question = DB::table('quiz_questions')
            ->where('quiz_id', $quiz['id'])
            ->first();

        $correctOption = DB::table('quiz_options')
            ->where('quiz_question_id', $question->id)
            ->where('is_correct', true)
            ->first();

        $wrongOption = DB::table('quiz_options')
            ->where('quiz_question_id', $question->id)
            ->where('is_correct', false)
            ->first();

        Sanctum::actingAs($student);

        $start = $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertCreated();

        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts/' . $start->json('attempt_id') . '/submit', [
            'answers' => [
                [
                    'question_id' => $question->id,
                    'option_id' => $wrongOption->id,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('review.0.question_id', $question->id)
            ->assertJsonPath('review.0.user_answer.option_id', $wrongOption->id)
            ->assertJsonPath('review.0.user_answer.option_text', $wrongOption->option_text)
            ->assertJsonPath('review.0.correct_answer.option_id', $correctOption->id)
            ->assertJsonPath('review.0.correct_answer.option_text', $correctOption->option_text)
            ->assertJsonPath('review.0.is_correct', false)
            ->assertJsonPath('review.0.points_awarded', 0);
    }

    public function test_quiz_attempt_limit_blocks_retry_after_limit_is_reached(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator, ['max_attempts' => 1]);

        Sanctum::actingAs($student);

        $start = $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertCreated()
            ->assertJsonPath('max_attempts', 1)
            ->assertJsonPath('attempts_used', 0)
            ->assertJsonPath('can_attempt', true);

        $attemptId = $start->json('attempt_id');

        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts/' . $attemptId . '/submit', [
            'answers' => [],
        ])
            ->assertOk()
            ->assertJsonPath('attempts_used', 1)
            ->assertJsonPath('attempts_remaining', 0)
            ->assertJsonPath('can_attempt', false);

        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Batas percobaan kuis telah tercapai.')
            ->assertJsonPath('attempts_used', 1)
            ->assertJsonPath('attempts_remaining', 0)
            ->assertJsonPath('can_attempt', false);

        $this->getJson('/api/v1/quizzes/' . $quiz['id'])
            ->assertOk()
            ->assertJsonPath('max_attempts', 1)
            ->assertJsonPath('attempts_used', 1)
            ->assertJsonPath('attempts_remaining', 0)
            ->assertJsonPath('can_attempt', false);
    }

    public function test_unlimited_quiz_can_be_retried_after_completion(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator, ['max_attempts' => null]);

        Sanctum::actingAs($student);

        $firstStart = $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertCreated()
            ->assertJsonPath('max_attempts', null)
            ->assertJsonPath('can_attempt', true);

        $firstAttemptId = $firstStart->json('attempt_id');

        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts/' . $firstAttemptId . '/submit', [
            'answers' => [],
        ])
            ->assertOk()
            ->assertJsonPath('attempts_used', 1)
            ->assertJsonPath('attempts_remaining', null)
            ->assertJsonPath('can_attempt', true);

        $secondStart = $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertCreated()
            ->assertJsonPath('attempts_used', 1)
            ->assertJsonPath('can_attempt', true);

        $this->assertNotSame($firstAttemptId, $secondStart->json('attempt_id'));
    }


    public function test_creator_can_list_only_own_inactive_quizzes_and_reactivate_one(): void
    {
        $creator = User::factory()->create();
        $otherCreator = User::factory()->create();

        $ownQuiz = $this->createQuiz($creator, ['title' => 'Kuis Nonaktif Milik Saya']);
        $otherQuiz = $this->createQuiz($otherCreator, ['title' => 'Kuis Nonaktif User Lain']);

        Sanctum::actingAs($creator);
        $this->deleteJson('/api/v1/quizzes/' . $ownQuiz['id'])->assertOk();

        Sanctum::actingAs($otherCreator);
        $this->deleteJson('/api/v1/quizzes/' . $otherQuiz['id'])->assertOk();

        Sanctum::actingAs($creator);

        $inactive = $this->getJson('/api/v1/quizzes?status=inactive')
            ->assertOk();

        $inactiveIds = collect($inactive->json())->pluck('id')->all();
        $this->assertContains($ownQuiz['id'], $inactiveIds);
        $this->assertNotContains($otherQuiz['id'], $inactiveIds);

        $this->putJson('/api/v1/quizzes/' . $ownQuiz['id'], [
            'is_published' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_published', true)
            ->assertJsonPath('data.can_manage', true);

        $this->assertDatabaseHas('quizzes', [
            'id' => $ownQuiz['id'],
            'is_published' => true,
        ]);

        $active = $this->getJson('/api/v1/quizzes')->assertOk();
        $activeIds = collect($active->json())->pluck('id')->all();
        $this->assertContains($ownQuiz['id'], $activeIds);

        $inactiveAgain = $this->getJson('/api/v1/quizzes?status=inactive')->assertOk();
        $inactiveAgainIds = collect($inactiveAgain->json())->pluck('id')->all();
        $this->assertNotContains($ownQuiz['id'], $inactiveAgainIds);
    }

    public function test_inactive_quiz_cannot_be_started_by_other_user(): void
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();
        $quiz = $this->createQuiz($creator);

        Sanctum::actingAs($creator);
        $this->deleteJson('/api/v1/quizzes/' . $quiz['id'])->assertOk();

        Sanctum::actingAs($student);

        $this->postJson('/api/v1/quizzes/' . $quiz['id'] . '/attempts')
            ->assertNotFound()
            ->assertJsonPath('message', 'Kuis tidak ditemukan.');
    }

    private function createQuiz(User $user, array $overrides = []): array
    {
        Sanctum::actingAs($user);

        return $this->postJson('/api/v1/quizzes', array_merge($this->quizPayload(), $overrides))
            ->assertCreated()
            ->json('data');
    }

    private function quizPayload(): array
    {
        return [
            'subject_id' => null,
            'title' => 'Quiz Laravel Dasar',
            'description' => 'Quiz untuk menguji pemahaman Laravel.',
            'duration_minutes' => 30,
            'pass_score' => 70,
            'is_published' => true,
            'questions' => [
                [
                    'question_text' => 'Apa command untuk membuat project Laravel?',
                    'question_type' => 'multiple_choice',
                    'points' => 2,
                    'options' => [
                        ['option_text' => 'composer create-project laravel/laravel app', 'is_correct' => true],
                        ['option_text' => 'npm create laravel', 'is_correct' => false],
                        ['option_text' => 'php create laravel', 'is_correct' => false],
                        ['option_text' => 'artisan new project', 'is_correct' => false],
                    ],
                ],
            ],
        ];
    }
}
