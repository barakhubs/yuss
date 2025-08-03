<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quarter extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'quarter',
        'start_date',
        'end_date',
        'shareout_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'shareout_date' => 'date',
    ];

    public function savingsTargets(): HasMany
    {
        return $this->hasMany(MemberSavingsTarget::class);
    }

    public function savings(): HasMany
    {
        return $this->hasMany(Saving::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function shareoutDecisions(): HasMany
    {
        return $this->hasMany(ShareoutDecision::class);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    public function getIsShareoutPeriodAttribute(): bool
    {
        return $this->status === 'shareout';
    }

    public static function getCurrentQuarter(): ?Quarter
    {
        return static::where('status', 'active')->first();
    }

    public static function getShareoutQuarter(): ?Quarter
    {
        return static::where('status', 'shareout')->first();
    }
}
