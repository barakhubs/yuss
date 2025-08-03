<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaccoYear extends Model
{
    protected $fillable = [
        'organization_id',
        'year',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function quarters(): HasMany
    {
        return $this->hasMany(SaccoQuarter::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function yearEndShareouts(): HasMany
    {
        return $this->hasMany(YearEndShareout::class);
    }

    public function interestDistributions(): HasMany
    {
        return $this->hasMany(InterestDistribution::class);
    }

    /**
     * Activate this year and deactivate others for the organization
     */
    public function activate(): void
    {
        // Deactivate all other years for this organization
        static::where('organization_id', $this->organization_id)
            ->where('id', '!=', $this->id)
            ->update(['is_active' => false]);

        // Activate this year
        $this->update(['is_active' => true]);
    }

    /**
     * Get the current active quarter
     */
    public function getCurrentQuarter(): ?SaccoQuarter
    {
        return $this->quarters()
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();
    }

    /**
     * Check if year is completed (all quarters completed)
     */
    public function isCompleted(): bool
    {
        return $this->quarters()->where('is_completed', false)->count() === 0;
    }
}
