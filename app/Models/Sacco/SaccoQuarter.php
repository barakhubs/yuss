<?php

namespace App\Models\Sacco;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaccoQuarter extends Model
{
    protected $fillable = [
        'sacco_year_id',
        'quarter_number',
        'start_date',
        'end_date',
        'is_completed',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_completed' => 'boolean',
    ];

    public function saccoYear(): BelongsTo
    {
        return $this->belongsTo(SaccoYear::class);
    }

    public function memberSavings(): HasMany
    {
        return $this->hasMany(MemberSaving::class);
    }

    /**
     * Get member savings for a specific user
     */
    public function getSavingsForUser(User $user): ?MemberSaving
    {
        return $this->memberSavings()->where('user_id', $user->id)->first();
    }

    /**
     * Mark quarter as completed
     */
    public function markCompleted(): void
    {
        $this->update(['is_completed' => true]);
    }

    /**
     * Get total savings for this quarter
     */
    public function getTotalSavings(): float
    {
        return $this->memberSavings()->sum('amount');
    }

    /**
     * Check if quarter is currently active (current date falls within quarter)
     */
    public function isActive(): bool
    {
        $now = now()->toDateString();
        return $now >= $this->start_date->toDateString() && $now <= $this->end_date->toDateString();
    }
}
