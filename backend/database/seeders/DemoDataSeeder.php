<?php

namespace Database\Seeders;

use App\Models\BuddyConnection;
use App\Models\GroupMember;
use App\Models\Material;
use App\Models\MaterialReport;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\SessionParticipant;
use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\TutoringRequest;
use App\Models\TutoringReview;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Data demo lengkap lewat factory. Idempoten: dilewati bila
 * grup penanda demo sudah ada.
 */
class DemoDataSeeder extends Seeder
{
    private const MARKER_SLUG = 'demo-grup-belajar';

    public function run(): void
    {
        if (StudyGroup::withTrashed()->where('slug', self::MARKER_SLUG)->exists()) {
            return;
        }

        $budi = User::where('email', 'budi@example.com')->first()
            ?? User::factory()->withProfile()->create(['email' => 'budi@example.com']);
        $siti = User::where('email', 'siti@example.com')->first()
            ?? User::factory()->withProfile()->create(['email' => 'siti@example.com']);

        $subject = Subject::where('code', 'CS101')->first()
            ?? Subject::factory()->create();

        // Grup, sesi, dan peserta
        $group = StudyGroup::factory()
            ->withCreatorAsAdmin()
            ->create([
                'creator_id' => $budi->id,
                'subject_id' => $subject->id,
                'name' => 'Grup Belajar Demo',
                'slug' => self::MARKER_SLUG,
            ]);

        GroupMember::factory()->create([
            'study_group_id' => $group->id,
            'user_id' => $siti->id,
        ]);

        $session = StudySession::factory()->create([
            'host_id' => $budi->id,
            'study_group_id' => $group->id,
            'subject_id' => $subject->id,
        ]);

        SessionParticipant::factory()->host()->create([
            'study_session_id' => $session->id,
            'user_id' => $budi->id,
        ]);
        SessionParticipant::factory()->create([
            'study_session_id' => $session->id,
            'user_id' => $siti->id,
        ]);

        // Materi dan laporan
        $material = Material::factory()->create(['user_id' => $budi->id]);
        MaterialReport::factory()->create([
            'material_id' => $material->id,
            'reporter_id' => $siti->id,
        ]);

        // Kuis, pertanyaan, dan percobaan
        $quiz = Quiz::factory()
            ->published()
            ->withQuestions(3)
            ->create([
                'creator_id' => $budi->id,
                'subject_id' => $subject->id,
            ]);

        QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $siti->id,
        ]);

        // Tutoring
        $tutor = TutorProfile::factory()->verified()->create([
            'user_id' => $budi->id,
        ]);

        $request = TutoringRequest::factory()->completed()->create([
            'student_id' => $siti->id,
            'tutor_profile_id' => $tutor->id,
            'subject_id' => $subject->id,
        ]);

        TutoringReview::factory()->create([
            'tutoring_request_id' => $request->id,
        ]);

        // Koneksi buddy
        BuddyConnection::firstOrCreate(
            [
                'requester_id' => $siti->id,
                'receiver_id' => $budi->id,
            ],
            ['status' => 'accepted']
        );
    }
}
