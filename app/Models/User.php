<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'timezone',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
            'last_login_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    /**
     * Get all organizations the user belongs to.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'organization_users')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Get organizations owned by the user.
     */
    public function ownedOrganizations()
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    /**
     * Get the user's current organization.
     */
    public function currentOrganization()
    {
        // This could be stored in session or determined by context
        return $this->organizations()->first();
    }

    /**
     * Check if user is admin of an organization.
     */
    public function isAdminOf(Organization $organization): bool
    {
        return $this->organizations()
            ->where('organization_id', $organization->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    /**
     * Check if user is owner of an organization.
     */
    public function isOwnerOf(Organization $organization): bool
    {
        return $organization->owner_id === $this->id;
    }

    /**
     * Get invitations sent by this user.
     */
    public function sentInvitations()
    {
        return $this->hasMany(Invitation::class, 'invited_by');
    }

    // SACCO Relationships

    /**
     * Get user's committee roles
     */
    public function committeeRoles()
    {
        return $this->hasMany(\App\Models\Sacco\MemberCommitteeRole::class);
    }

    /**
     * Get user's active committee role
     */
    public function activeCommitteeRole()
    {
        return $this->hasOne(\App\Models\Sacco\MemberCommitteeRole::class)->where('is_active', true);
    }

    /**
     * Get user's savings
     */
    public function savings()
    {
        return $this->hasMany(\App\Models\Sacco\MemberSaving::class);
    }

    /**
     * Get user's loans
     */
    public function loans()
    {
        return $this->hasMany(\App\Models\Sacco\Loan::class);
    }

    /**
     * Get loans approved by this user
     */
    public function approvedLoans()
    {
        return $this->hasMany(\App\Models\Sacco\Loan::class, 'approved_by');
    }

    /**
     * Get user's interest distributions
     */
    public function interestDistributions()
    {
        return $this->hasMany(\App\Models\Sacco\InterestDistribution::class);
    }

    /**
     * Get user's year-end shares
     */
    public function yearEndShares()
    {
        return $this->hasMany(\App\Models\Sacco\IndividualYearShare::class);
    }

    /**
     * Check if user is a committee member
     */
    public function isCommitteeMember(): bool
    {
        return $this->activeCommitteeRole()->exists();
    }

    /**
     * Get user's committee role name
     */
    public function getCommitteeRole(): ?string
    {
        return $this->activeCommitteeRole?->role;
    }

    /**
     * Check if user can apply for a loan
     */
    public function canApplyForLoan(\App\Models\Organization $organization): bool
    {
        // Must be a member of the organization
        if (!$this->organizations()->where('organization_id', $organization->id)->exists()) {
            return false;
        }

        // Cannot have an active unpaid loan
        return !$this->loans()
            ->where('organization_id', $organization->id)
            ->where('status', 'disbursed')
            ->where('outstanding_balance', '>', 0)
            ->exists();
    }

    /**
     * Get total savings for user in organization
     */
    public function getTotalSavings(\App\Models\Organization $organization): float
    {
        return $this->savings()
            ->where('organization_id', $organization->id)
            ->sum('amount');
    }

    /**
     * Get available (not shared out) savings for user in organization
     */
    public function getAvailableSavings(\App\Models\Organization $organization): float
    {
        return $this->savings()
            ->where('organization_id', $organization->id)
            ->where('shared_out', false)
            ->sum('amount');
    }

    /**
     * Get total interest earnings for user
     */
    public function getTotalInterestEarnings(\App\Models\Organization $organization): float
    {
        return $this->interestDistributions()
            ->where('organization_id', $organization->id)
            ->sum('amount');
    }
}
