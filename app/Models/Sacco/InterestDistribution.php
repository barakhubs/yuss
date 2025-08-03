<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterestDistribution extends Model
{
    protected $fillable = [
        'organization_id',
        'sacco_year_id',
        'loan_id',
        'user_id',
        'amount',
        'distribution_type',
        'description',
        'distributed_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'distributed_date' => 'date',
    ];

    public const DISTRIBUTION_TYPES = [
        'loan_bearer_return' => 'Loan Bearer Return (50%)',
        'committee_share' => 'Committee Member Share',
        'member_share' => 'Regular Member Share',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function saccoYear(): BelongsTo
    {
        return $this->belongsTo(SaccoYear::class);
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get distribution type display name
     */
    public function getDistributionTypeDisplayName(): string
    {
        return self::DISTRIBUTION_TYPES[$this->distribution_type] ?? $this->distribution_type;
    }

    /**
     * Get total interest earnings for a user in a year
     */
    public static function getTotalEarningsForUser(User $user, SaccoYear $saccoYear): float
    {
        return static::where('user_id', $user->id)
            ->where('sacco_year_id', $saccoYear->id)
            ->sum('amount');
    }

    /**
     * Get total distributions by type for a year
     */
    public static function getTotalByType(SaccoYear $saccoYear, string $distributionType): float
    {
        return static::where('sacco_year_id', $saccoYear->id)
            ->where('distribution_type', $distributionType)
            ->sum('amount');
    }
}
