<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'study_session_id',
        'user_id',
        'role',
        'status',
        'joined_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function studySession(): BelongsTo
    {
        return $this->belongsTo(StudySession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}