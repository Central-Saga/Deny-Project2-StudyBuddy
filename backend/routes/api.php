<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BuddyController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\StudySessionController;
use App\Http\Controllers\SessionParticipantController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

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

    // Groups
    Route::get('/groups', [GroupController::class, 'index']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::post(
        '/groups/{id}/toggle-join',
        [GroupController::class, 'joinToggle']
    );
});