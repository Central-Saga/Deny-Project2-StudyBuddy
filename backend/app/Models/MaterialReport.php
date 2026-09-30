<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'reporter_id',
        'reason',
        'status',
        'resolution_note',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function material(): BelongsTo
    {
        return $this
            ->belongsTo(Material::class)
            ->withTrashed();
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reporter_id'
        );
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reviewed_by'
        );
    }
}