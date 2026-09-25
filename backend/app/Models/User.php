<?php

namespace App\Models;

use App\Models\Availability;
use App\Models\Profile;
use App\Models\StudyGroup;
use App\Models\StudySession;
use App\Models\UserSubject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'course',
        'skills',
        'learning_styles',
        'bio',
        'last_active_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'skills' => 'array',
            'learning_styles' => 'array',
            'last_active_at' => 'datetime',
        ];
    }

    // Relasi ke Profile
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    // Relasi ke Subjects (Minat/Keahlian)
    public function userSubjects(): HasMany
    {
        return $this->hasMany(UserSubject::class);
    }

    // Relasi ke Availability
    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class);
    }

    // Grup Belajar yang Dibuat
    public function createdGroups(): HasMany
    {
        return $this->hasMany(
            StudyGroup::class,
            'creator_id'
        );
    }

    // Sesi Belajar yang Dibuat/Dihost
    public function hostedSessions(): HasMany
    {
        return $this->hasMany(
            StudySession::class,
            'host_id'
        );
    }
}