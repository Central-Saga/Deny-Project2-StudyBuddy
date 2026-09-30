<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /*
    |--------------------------------------------------------------------------
    | Role
    |--------------------------------------------------------------------------
    */

    public const ROLE_USER = 'user';
    public const ROLE_ADMIN = 'admin';

    /*
    |--------------------------------------------------------------------------
    | Account Status
    |--------------------------------------------------------------------------
    */

    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';

    /*
    |--------------------------------------------------------------------------
    | Default Attributes
    |--------------------------------------------------------------------------
    |
    | Default ini penting supaya object User yang dibuat melalui factory,
    | register, maupun proses lain langsung memiliki role dan status aktif
    | tanpa harus melakukan refresh dari database terlebih dahulu.
    |
    */

    protected $attributes = [
        'role' => self::ROLE_USER,
        'account_status' => self::STATUS_ACTIVE,
    ];

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    |
    | role dan account_status sengaja tidak dimasukkan ke fillable
    | untuk mencegah user melakukan privilege escalation melalui request.
    |
    */

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

    /*
    |--------------------------------------------------------------------------
    | Hidden Attributes
    |--------------------------------------------------------------------------
    */

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Role Helpers
    |--------------------------------------------------------------------------
    */

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /*
    |--------------------------------------------------------------------------
    | Account Status Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->account_status === self::STATUS_ACTIVE;
    }

    public function isSuspended(): bool
    {
        return $this->account_status === self::STATUS_SUSPENDED;
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function userSubjects(): HasMany
    {
        return $this->hasMany(UserSubject::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class);
    }

    public function createdGroups(): HasMany
    {
        return $this->hasMany(
            StudyGroup::class,
            'creator_id'
        );
    }

    public function hostedSessions(): HasMany
    {
        return $this->hasMany(
            StudySession::class,
            'host_id'
        );
    }
}