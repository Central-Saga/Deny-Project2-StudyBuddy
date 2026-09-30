<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMaterialReportController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminGroupController;
use App\Http\Controllers\Admin\AdminTutorController;
use App\Http\Controllers\Admin\AdminQuizController;

use App\Http\Controllers\BuddyController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\MaterialReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SessionParticipantController;
use App\Http\Controllers\StudySessionController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TutoringController;
use App\Http\Controllers\TutoringReviewController;

Route::prefix('v1')->group(function () {

   // Public Routes
    Route::post(
        '/register',
        [AuthController::class, 'register']
    )->middleware('throttle:5,1');

    Route::post(
        '/login',
        [AuthController::class, 'login']
    )->middleware('throttle:5,1');

    // Protected Routes

    Route::middleware([
        'auth:sanctum',
        'active',
    ])->group(function () {

        // Admin Routes

        Route::prefix('admin')
            ->middleware('admin')
            ->group(function () {

                // Dashboard  Admin
                Route::get(
                    '/dashboard',
                    [AdminDashboardController::class, 'index']
                );

                // Material Reports Admin
                Route::get(
                    '/material-reports',
                    [
                        AdminMaterialReportController::class,
                        'index',
                    ]
                );

                Route::get(
                    '/material-reports/{report}',
                    [
                        AdminMaterialReportController::class,
                        'show',
                    ]
                );

                Route::get(
                    '/material-reports/{report}/download',
                    [
                        AdminMaterialReportController::class,
                        'download',
                    ]
                );

                Route::patch(
                    '/material-reports/{report}',
                    [
                        AdminMaterialReportController::class,
                        'update',
                    ]
                );

                Route::post(
                    '/material-reports/{report}/remove-material',
                    [
                        AdminMaterialReportController::class,
                        'removeMaterial',
                    ]
                );

                Route::post(
                    '/material-reports/{report}/restore-material',
                    [
                        AdminMaterialReportController::class,
                        'restoreMaterial',
                    ]
                );

                 // Users Admin
                Route::get(
                    '/users',
                    [AdminUserController::class, 'index']
                );

                Route::get(
                    '/users/{user}',
                    [AdminUserController::class, 'show']
                );

                Route::patch(
                    '/users/{user}/status',
                [AdminUserController::class, 'updateStatus']
                );

                // Study Groups Admin
                Route::get(
                    '/groups',
                    [AdminGroupController::class, 'index']
                );

                Route::get(
                    '/groups/{group}',
                    [AdminGroupController::class, 'show']
                );

                // Tutor Management Admin
                Route::get(
                    '/tutors',
                    [
                        AdminTutorController::class,
                        'index',
                    ]
                );

                Route::get(
                    '/tutors/{tutorProfile}',
                    [
                        AdminTutorController::class,
                        'show',
                    ]
                );

                Route::patch(
                    '/tutors/{tutorProfile}/verification',
                    [
                        AdminTutorController::class,
                        'updateVerification',
                    ]
                );

                // Quiz Management Admin
                Route::get(
                    '/quizzes',
                    [
                        AdminQuizController::class,
                        'index',
                    ]
                );

                Route::get(
                    '/quizzes/{quiz}',
                    [
                        AdminQuizController::class,
                        'show',
                    ]
                );

                Route::post(
                    '/quizzes/{quiz}/disable',
                    [
                        AdminQuizController::class,
                        'disable',
                    ]
                );

                Route::post(
                    '/quizzes/{quiz}/restore',
                    [
                        AdminQuizController::class,
                        'restore',
                    ]
                );
            });

        // Subjects
        Route::get(
            '/subjects',
            [SubjectController::class, 'index']
        );

        // Authentication

        Route::get(
            '/me',
            [AuthController::class, 'me']
        );

        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );

        // Study Sessions

        Route::apiResource(
            'study-sessions',
            StudySessionController::class
        )->parameters([
            'study-sessions' => 'studySession',
        ]);

        Route::post(
            '/study-sessions/{studySession}/join',
            [SessionParticipantController::class, 'join']
        );

        Route::post(
            '/study-sessions/{studySession}/leave',
            [SessionParticipantController::class, 'leave']
        );

        // Materials

        Route::apiResource(
            'materials',
            MaterialController::class
        );

        Route::get(
            '/materials/{material}/download',
            [MaterialController::class, 'download']
        );

        // Profile

        Route::put(
            '/profile',
            [ProfileController::class, 'update']
        );

        Route::post(
            '/profile/avatar',
            [ProfileController::class, 'uploadAvatar']
        );

        // Buddy / Find Buddy

        Route::get(
            '/buddy-connections',
            [BuddyController::class, 'connections']
        );

        Route::patch(
            '/buddy-connections/{connection}/accept',
            [BuddyController::class, 'accept']
        );

        Route::patch(
            '/buddy-connections/{connection}/reject',
            [BuddyController::class, 'reject']
        );

        Route::delete(
            '/buddy-connections/{connection}',
            [BuddyController::class, 'destroy']
        );

        Route::get(
            '/buddies',
            [BuddyController::class, 'index']
        );

        Route::get(
            '/buddies/{id}',
            [BuddyController::class, 'show']
        )->whereNumber('id');

        Route::post(
            '/buddies/{id}/connect',
            [BuddyController::class, 'connect']
        )->whereNumber('id');

        // Groups

        Route::get(
            '/groups',
            [GroupController::class, 'index']
        );

        Route::post(
            '/groups',
            [GroupController::class, 'store']
        );

        Route::get(
            '/groups/{group}',
            [GroupController::class, 'show']
        );

        Route::put(
            '/groups/{group}',
            [GroupController::class, 'update']
        );

        Route::delete(
            '/groups/{group}',
            [GroupController::class, 'destroy']
        );

        Route::post(
            '/groups/{group}/toggle-join',
            [GroupController::class, 'joinToggle']
        );

        Route::patch(
            '/groups/{group}/members/{member}/status',
            [GroupController::class, 'updateMemberStatus']
        );


        // Quiz

        Route::get(
            '/quizzes',
            [QuizController::class, 'index']
        );

        Route::post(
            '/quizzes',
            [QuizController::class, 'store']
        );

        Route::get(
            '/quizzes/{quiz}',
            [QuizController::class, 'show']
        );

        Route::put(
            '/quizzes/{quiz}',
            [QuizController::class, 'update']
        );

        Route::delete(
            '/quizzes/{quiz}',
            [QuizController::class, 'destroy']
        );

        Route::post(
            '/quizzes/{quiz}/attempts',
            [QuizController::class, 'start']
        );

        Route::post(
            '/quizzes/{quiz}/attempts/{attempt}/submit',
            [QuizController::class, 'submit']
        );

        // Peer Tutoring

        Route::get(
            '/tutoring/tutors',
            [TutoringController::class, 'tutors']
        );

        Route::get(
            '/tutoring/profile/me',
            [TutoringController::class, 'myProfile']
        );

        Route::post(
            '/tutoring/profile',
            [TutoringController::class, 'saveProfile']
        );

        Route::patch(
            '/tutoring/profile/status',
            [TutoringController::class, 'updateProfileStatus']
        );

        Route::get(
            '/tutoring/requests',
            [TutoringController::class, 'requests']
        );

        Route::post(
            '/tutoring/requests',
            [TutoringController::class, 'createRequest']
        );

        Route::patch(
            '/tutoring/requests/{id}/status',
            [TutoringController::class, 'updateStatus']
        );

        Route::patch(
            '/tutoring/requests/{id}/session',
            [TutoringController::class, 'updateSession']
        );

        Route::post(
            '/tutoring/requests/{tutoringRequest}/reviews',
            [TutoringReviewController::class, 'store']
        );

        Route::get(
            '/tutoring/tutors/{tutorProfile}/reviews',
            [TutoringReviewController::class, 'index']
        );


        // Notifications

        Route::get(
            '/notifications',
            [NotificationController::class, 'index']
        );

        Route::patch(
            '/notifications/{id}/read',
            [NotificationController::class, 'markRead']
        );

        Route::post(
            '/notifications/read-all',
            [NotificationController::class, 'markAllRead']
        );


        // Material Reports - User

        Route::get(
            '/material-reports',
            [MaterialReportController::class, 'index']
        );

        Route::post(
            '/materials/{material}/reports',
            [MaterialReportController::class, 'store']
        );
    });
});