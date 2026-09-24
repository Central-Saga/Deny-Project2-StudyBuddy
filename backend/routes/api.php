<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\BuddyController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\StudySessionController;
use App\Http\Controllers\SessionParticipantController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\TutoringController;
use App\Http\Controllers\NotificationController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/subjects', [SubjectController::class, 'index']);

    // Authentication
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Study Sessions
    Route::apiResource('study-sessions', StudySessionController::class)
        ->parameters([
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
    Route::apiResource('materials', MaterialController::class);

    Route::get(
        'materials/{material}/download',
        [MaterialController::class, 'download']
    );

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);

    // Buddy
    Route::get('/buddies', [BuddyController::class, 'index']);
    Route::post('/buddies/{id}/connect', [BuddyController::class, 'connect']);

    // Groups
    Route::get('/groups', [GroupController::class, 'index']);
    Route::post('/groups', [GroupController::class, 'store']);

    Route::post(
        '/groups/{id}/toggle-join',
        [GroupController::class, 'joinToggle']
    );

    // Quiz
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'start']);
    Route::post(
        '/quizzes/{quiz}/attempts/{attempt}/submit',
        [QuizController::class, 'submit']
    );

    // Peer Tutoring
    Route::get('/tutoring/tutors', [TutoringController::class, 'tutors']);
    Route::get('/tutoring/profile/me', [TutoringController::class, 'myProfile']);
    Route::post('/tutoring/profile', [TutoringController::class, 'saveProfile']);
    Route::get('/tutoring/requests', [TutoringController::class, 'requests']);
    Route::post('/tutoring/requests', [TutoringController::class, 'createRequest']);
    Route::patch(
        '/tutoring/requests/{id}/status',
        [TutoringController::class, 'updateStatus']
    );

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch(
        '/notifications/{id}/read',
        [NotificationController::class, 'markRead']
    );
    Route::post(
        '/notifications/read-all',
        [NotificationController::class, 'markAllRead']
    );
});