<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'sacco_category',
        'savings_category',
        'is_verified',
        'is_super_admin',
        'created_by_admin',
        'invitation_token',
        'invited_at',
        'email_verified_at',
    ];

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'invitation_token',
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
            'is_verified' => 'boolean',
            'is_super_admin' => 'boolean',
            'created_by_admin' => 'boolean',
            'invited_at' => 'datetime',
        ];
    }

    /**
     * Check if user is admin (chairperson with admin privileges)
     */
    public function isAdmin(): bool
    {
        return $this->role === 'chairperson';
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin === true;
    }

    /**
     * Check if user is committee member (chairperson, secretary, treasurer, disburser)
     * Note: This is kept for legacy purposes, but only chairperson has elevated privileges now
     */
    public function isCommitteeMember(): bool
    {
        return in_array($this->role, ['chairperson', 'secretary', 'treasurer', 'disburser']);
    }

    /**
     * Check if user can approve loans (chairperson only)
     */
    public function canApproveLoans(): bool
    {
        return $this->role === 'chairperson';
    }

    /**
     * Check if user can disburse loans (chairperson only)
     */
    public function canDisburseLoans(): bool
    {
        return $this->role === 'chairperson';
    }

    /**
     * Get user's full name
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name) ?: $this->name;
    }

    /**
     * Get invitations sent by this user.
     */
    // public function sentInvitations()
    // {
    //     return $this->hasMany(Invitation::class, 'invited_by');
    // }

    /**
     * Get user's savings targets
     */
    public function savingsTargets(): HasMany
    {
        return $this->hasMany(MemberSavingsTarget::class);
    }

    /**
     * Get user's savings records
     */
    public function savings(): HasMany
    {
        return $this->hasMany(Saving::class);
    }

    /**
     * Get user's loans
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Get user's shareout decisions
     */
    public function shareoutDecisions(): HasMany
    {
        return $this->hasMany(ShareoutDecision::class);
    }

    /**
     * Get user's loan repayments they recorded
     */
    public function recordedRepayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class, 'recorded_by');
    }

    /**
     * Get user's savings they recorded for others
     */
    public function recordedSavings(): HasMany
    {
        return $this->hasMany(Saving::class, 'recorded_by');
    }

    /**
     * Check if user has an active loan
     */
    public function hasActiveLoan(): bool
    {
        return $this->loans()
            ->whereIn('status', ['approved', 'disbursed'])
            ->exists();
    }

    /**
     * Check if user has an active loan of a specific type
     */
    public function hasActiveLoanOfType(string $loanType): bool
    {
        return $this->loans()
            ->where('loan_type', $loanType)
            ->whereIn('status', ['approved', 'disbursed'])
            ->exists();
    }

    /**
     * Check if user can apply for a specific loan type based on restrictions
     */
    public function canApplyForLoanType(string $loanType): bool
    {
        // Check savings loan and yukon welfare mutual exclusivity
        if ($loanType === 'savings_loan' && config('sacco.loan_restrictions.yukon_welfare_blocks_savings_loan')) {
            if ($this->hasActiveLoanOfType('yukon_welfare_loan')) {
                return false;
            }
        }

        if ($loanType === 'yukon_welfare_loan' && config('sacco.loan_restrictions.savings_loan_blocks_yukon_welfare')) {
            if ($this->hasActiveLoanOfType('savings_loan')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get user's current savings balance
     */
    public function getCurrentSavingsBalance(): float
    {
        return $this->savings()->sum('amount');
    }

    /**
     * Get user's savings for a specific quarter
     */
    public function getSavingsForQuarter(Quarter $quarter): float
    {
        return $this->savings()
            ->where('quarter_id', $quarter->id)
            ->sum('amount');
    }

    /**
     * Get user's target for current quarter
     */
    public function getCurrentQuarterTarget(): ?MemberSavingsTarget
    {
        return $this->savingsTargets()
            ->whereHas('quarter', function ($query) {
                $query->where('status', 'active');
            })
            ->first();
    }

    /**
     * Check if current user is being impersonated
     */
    public function isBeingImpersonated(): bool
    {
        return session()->has('impersonator_id');
    }

    /**
     * Get the user who is impersonating this user
     */
    public function getImpersonator(): ?User
    {
        $impersonatorId = session('impersonator_id');
        return $impersonatorId ? User::find($impersonatorId) : null;
    }

    /**
     * Check if this user can be impersonated
     */
    public function canBeImpersonated(): bool
    {
        // Can impersonate any verified member (not admins)
        return !$this->isAdmin() && $this->is_verified;
    }

    /**
     * Get monthly savings amount based on category
     */
    public function getMonthlySavingsAmount(): ?float
    {
        if (!$this->savings_category) {
            return null;
        }

        return config("sacco.categories.{$this->savings_category}.monthly_savings");
    }

    /**
     * Get welfare payout details for this member's category
     */
    public function getWelfarePayout(): ?array
    {
        if (!$this->savings_category) {
            return null;
        }

        return config("sacco.categories.{$this->savings_category}.welfare");
    }

    /**
     * Get loan limits for a specific loan type based on category
     */
    public function getLoanLimits(string $loanType = 'savings_loan'): ?array
    {
        if (!$this->savings_category) {
            return null;
        }

        return config("sacco.categories.{$this->savings_category}.loans.{$loanType}");
    }

    /**
     * Check if member can apply for a specific loan type at current date
     */
    public function canApplyForLoan(string $loanType = 'savings_loan'): bool
    {
        if (!$this->savings_category) {
            return false;
        }

        $loanConfig = config("sacco.categories.{$this->savings_category}.loans.{$loanType}");

        if (!$loanConfig) {
            return false;
        }

        // Check if current month is >= start month
        $currentMonth = now()->month;
        $startMonth = $loanConfig['start_month'] ?? 1;

        return $currentMonth >= $startMonth;
    }

    /**
     * Get savings category display name
     */
    public function getCategoryDisplayAttribute(): ?string
    {
        if (!$this->savings_category) {
            return null;
        }

        $amount = $this->getMonthlySavingsAmount();
        return "Category {$this->savings_category} (€{$amount}/month)";
    }

    /**
     * Check if user has a category assigned
     */
    public function hasCategory(): bool
    {
        return !is_null($this->savings_category);
    }
}
