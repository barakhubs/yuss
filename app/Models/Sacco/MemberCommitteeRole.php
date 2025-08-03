<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberCommitteeRole extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'role',
        'assigned_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public const ROLES = [
        'chairperson' => 'Chairperson',
        'secretary' => 'Secretary',
        'treasurer' => 'Treasurer',
        'disbursor' => 'Disbursor',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get role display name
     */
    public function getRoleDisplayName(): string
    {
        return self::ROLES[$this->role] ?? $this->role;
    }

    /**
     * Deactivate this role
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'end_date' => now(),
        ]);
    }

    /**
     * Scope for active roles
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get active committee members for organization
     */
    public static function getActiveCommitteeMembers(Organization $organization)
    {
        return static::with('user')
            ->where('organization_id', $organization->id)
            ->where('is_active', true)
            ->get();
    }
}
