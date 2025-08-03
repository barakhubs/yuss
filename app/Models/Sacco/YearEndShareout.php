<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YearEndShareout extends Model
{
    protected $fillable = [
        'organization_id',
        'sacco_year_id',
        'total_interest_pool',
        'committee_total_share',
        'members_total_share',
        'is_completed',
        'shareout_date',
    ];

    protected $casts = [
        'total_interest_pool' => 'decimal:2',
        'committee_total_share' => 'decimal:2',
        'members_total_share' => 'decimal:2',
        'is_completed' => 'boolean',
        'shareout_date' => 'date',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function saccoYear(): BelongsTo
    {
        return $this->belongsTo(SaccoYear::class);
    }

    public function individualShares(): HasMany
    {
        return $this->hasMany(IndividualYearShare::class);
    }

    /**
     * Calculate and distribute year-end shares
     */
    public function calculateAndDistribute(): void
    {
        $saccoYear = $this->saccoYear;
        $organization = $this->organization;

        // Get all loans repaid in this year
        $repaidLoans = $saccoYear->loans()->where('status', 'repaid')->get();

        // Calculate total interest from all repaid loans
        $totalInterest = $repaidLoans->sum(function ($loan) {
            return $loan->getInterestAmount();
        });

        // 50% was already returned to loan bearers, so we have 50% to distribute
        $availableForDistribution = $totalInterest * 0.5;

        // Split the remaining 50%: 50% to committee, 50% to all members
        $committeeShare = $availableForDistribution * 0.5;
        $membersShare = $availableForDistribution * 0.5;

        $this->update([
            'total_interest_pool' => $totalInterest,
            'committee_total_share' => $committeeShare,
            'members_total_share' => $membersShare,
        ]);

        // Distribute to committee members (4 people)
        $committeeMembers = MemberCommitteeRole::getActiveCommitteeMembers($organization);
        $committeeIndividualShare = $committeeMembers->count() > 0 ? $committeeShare / $committeeMembers->count() : 0;

        foreach ($committeeMembers as $committeeMember) {
            $this->individualShares()->create([
                'user_id' => $committeeMember->user_id,
                'amount' => $committeeIndividualShare,
                'share_type' => 'committee_member',
            ]);
        }

        // Distribute to all other members (excluding committee members, but including loan bearers)
        $allMembers = $organization->users()->get();
        $committeeUserIds = $committeeMembers->pluck('user_id')->toArray();
        $regularMembers = $allMembers->whereNotIn('id', $committeeUserIds);

        // Include loan bearers again in regular member distribution
        $eligibleMembers = $allMembers; // All members including committee and loan bearers
        $memberIndividualShare = $eligibleMembers->count() > 0 ? $membersShare / $eligibleMembers->count() : 0;

        foreach ($eligibleMembers as $member) {
            // Skip if already got committee share
            if (!in_array($member->id, $committeeUserIds)) {
                $this->individualShares()->create([
                    'user_id' => $member->id,
                    'amount' => $memberIndividualShare,
                    'share_type' => 'regular_member',
                ]);
            }
        }

        $this->markCompleted();
    }

    /**
     * Mark shareout as completed
     */
    public function markCompleted(): void
    {
        $this->update([
            'is_completed' => true,
            'shareout_date' => now(),
        ]);
    }
}
