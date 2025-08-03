<?php

namespace App\Models\Sacco;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndividualYearShare extends Model
{
    protected $fillable = [
        'year_end_shareout_id',
        'user_id',
        'amount',
        'share_type',
        'is_disbursed',
        'disbursed_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_disbursed' => 'boolean',
        'disbursed_date' => 'date',
    ];

    public const SHARE_TYPES = [
        'committee_member' => 'Committee Member Share',
        'regular_member' => 'Regular Member Share',
    ];

    public function yearEndShareout(): BelongsTo
    {
        return $this->belongsTo(YearEndShareout::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get share type display name
     */
    public function getShareTypeDisplayName(): string
    {
        return self::SHARE_TYPES[$this->share_type] ?? $this->share_type;
    }

    /**
     * Mark share as disbursed
     */
    public function markDisbursed(): void
    {
        $this->update([
            'is_disbursed' => true,
            'disbursed_date' => now(),
        ]);
    }

    /**
     * Scope for disbursed shares
     */
    public function scopeDisbursed($query)
    {
        return $query->where('is_disbursed', true);
    }

    /**
     * Scope for pending shares
     */
    public function scopePending($query)
    {
        return $query->where('is_disbursed', false);
    }

    /**
     * Get total shares for a user across all years
     */
    public static function getTotalSharesForUser(User $user): float
    {
        return static::where('user_id', $user->id)->sum('amount');
    }
}
