<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\MaterialReport;
use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Menampilkan ringkasan statistik sistem.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'total_users' =>
                    User::query()
                        ->where('role', User::ROLE_USER)
                        ->count(),

                'active_users' =>
                    User::query()
                        ->where('role', User::ROLE_USER)
                        ->where(
                            'account_status',
                            User::STATUS_ACTIVE
                        )
                        ->count(),

                'suspended_users' =>
                    User::query()
                        ->where('role', User::ROLE_USER)
                        ->where(
                            'account_status',
                            User::STATUS_SUSPENDED
                        )
                        ->count(),

                'total_groups' =>
                    StudyGroup::query()->count(),

                'total_sessions' =>
                    StudySession::query()->count(),

                'total_materials' =>
                    Material::query()->count(),

                'total_quizzes' =>
                    DB::table('quizzes')->count(),

                'published_quizzes' =>
                    DB::table('quizzes')
                        ->where('is_published', true)
                        ->count(),

                'total_tutors' =>
                    TutorProfile::query()->count(),

                'verified_tutors' =>
                    TutorProfile::query()
                        ->where('is_verified', true)
                        ->count(),

                'total_material_reports' =>
                    MaterialReport::query()->count(),

                'pending_material_reports' =>
                    MaterialReport::query()
                        ->where('status', 'pending')
                        ->count(),
            ],
        ]);
    }
}