<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\BuddyController;
use App\Http\Controllers\GroupController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Butuh Token Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Route Profil
    Route::put('/profile', [ProfileController::class, 'update']);

    // Route Buddy & Groups
    Route::get('/buddies', [BuddyController::class, 'index']);
    Route::get('/groups', [GroupController::class, 'index']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::post('/groups/{id}/toggle-join', [GroupController::class, 'joinToggle']);
});