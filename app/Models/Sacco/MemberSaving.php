<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberSaving extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'sacco_quarter_id',
        'amount',
        'shared_out',
        'shared_out_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'shared_out' => 'boolean',
        'shared_out_date' => 'date',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function saccoQuarter(): BelongsTo
    {
        return $this->belongsTo(SaccoQuarter::class);
    }

    /**
     * Mark savings as shared out
     */
    public function shareOut(): void
    {
        $this->update([
            'shared_out' => true,
            'shared_out_date' => now(),
        ]);
    }

    /**
     * Scope for shared out savings
     */
    public function scopeSharedOut($query)
    {
        return $query->where('shared_out', true);
    }

    /**
     * Scope for not shared out savings
     */
    public function scopeNotSharedOut($query)
    {
        return $query->where('shared_out', false);
    }

    /**
     * Get total savings for a user across all quarters
     */
    public static function getTotalSavingsForUser(User $user, Organization $organization): float
    {
        return static::where('user_id', $user->id)
            ->where('organization_id', $organization->id)
            ->sum('amount');
    }

    /**
     * Get available (not shared out) savings for a user
     */
    public static function getAvailableSavingsForUser(User $user, Organization $organization): float
    {
        return static::where('user_id', $user->id)
            ->where('organization_id', $organization->id)
            ->where('shared_out', false)
            ->sum('amount');
    }
}
