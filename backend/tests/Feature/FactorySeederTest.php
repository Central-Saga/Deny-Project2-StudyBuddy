<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BuddyConnection;
use App\Models\GroupMember;
use App\Models\Material;
use App\Models\MaterialReport;
use App\Models\Profile;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\SessionParticipant;
use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\Subject;
use App\Models\TutorAvailability;
use App\Models\TutorProfile;
use App\Models\TutorSubject;
use App\Models\TutoringRequest;
use App\Models\TutoringReview;
use App\Models\User;
use App\Models\UserSubject;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class FactorySeederTest extends TestCase
{
    use RefreshDatabase;

    public static function factoryModels(): array
    {
        return array_map(fn (string $class) => [$class], [
            User::class,
            Subject::class,
            Profile::class,
            UserSubject::class,
            Availability::class,
            StudyGroup::class,
            GroupMember::class,
            StudySession::class,
            SessionParticipant::class,
            Material::class,
            MaterialReport::class,
            Quiz::class,
            QuizQuestion::class,
            QuizOption::class,
            QuizAttempt::class,
            QuizAnswer::class,
            TutorProfile::class,
            TutorSubject::class,
            TutorAvailability::class,
            TutoringRequest::class,
            TutoringReview::class,
            BuddyConnection::class,
        ]);
    }

    #[DataProvider('factoryModels')]
    public function test_factory_creates_a_persisted_model(string $model): void
    {
        $instance = $model::factory()->create();

        $this->assertTrue($instance->exists);
        $this->assertDatabaseHas($instance->getTable(), [
            $instance->getKeyName() => $instance->getKey(),
        ]);
    }

    public function test_user_factory_states(): void
    {
        $this->assertSame(User::ROLE_ADMIN, User::factory()->admin()->create()->role);
        $this->assertSame(
            User::STATUS_SUSPENDED,
            User::factory()->suspended()->create()->account_status
        );
        $this->assertNotNull(User::factory()->withProfile()->create()->profile);
    }

    public function test_quiz_factory_builds_questions_with_one_correct_option(): void
    {
        $quiz = Quiz::factory()->published()->withQuestions(2, 3)->create()->load('questions.options');

        $this->assertTrue($quiz->is_published);
        $this->assertCount(2, $quiz->questions);

        foreach ($quiz->questions as $question) {
            $this->assertCount(3, $question->options);
            $this->assertCount(1, $question->options->where('is_correct', true));
        }
    }

    public function test_completed_tutoring_review_uses_the_request_relations(): void
    {
        $review = TutoringReview::factory()->create();
        $request = $review->tutoringRequest;

        $this->assertSame('completed', $request->status);
        $this->assertSame($request->student_id, $review->student_id);
        $this->assertSame($request->tutor_profile_id, $review->tutor_profile_id);
    }

    public function test_database_seeder_is_idempotent(): void
    {
        $this->seed(DatabaseSeeder::class);
        $first = $this->tableCounts();

        $this->seed(DatabaseSeeder::class);

        $this->assertSame($first, $this->tableCounts());
        $this->assertGreaterThan(0, $first['study_groups']);
        $this->assertGreaterThan(0, $first['quizzes']);
    }

    private function tableCounts(): array
    {
        $counts = [];

        foreach ([
            'users', 'profiles', 'subjects', 'user_subjects', 'study_groups',
            'group_members', 'study_sessions', 'session_participants',
            'materials', 'material_reports', 'quizzes', 'quiz_questions',
            'quiz_options', 'quiz_attempts', 'tutor_profiles',
            'tutoring_requests', 'tutoring_reviews', 'buddy_connections',
        ] as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        return $counts;
    }
}
