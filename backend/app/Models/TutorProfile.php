<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TutorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'hourly_rate',
        'is_verified',
        'status',
        'rating_avg',
        'reviews_count',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'is_verified' => 'boolean',
        'rating_avg' => 'decimal:2',
        'reviews_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(TutorSubject::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(TutorAvailability::class);
    }

    public function tutoringRequests(): HasMany
    {
        return $this->hasMany(TutoringRequest::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(TutoringReview::class);
    }
}