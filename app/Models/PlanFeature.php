<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanFeature extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'name',
        'slug',
        'value',
        'type',
        'description',
        'sort_order',
    ];

    /**
     * Get the plan that owns this feature.
     */
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if this is a boolean feature.
     */
    public function isBoolean(): bool
    {
        return $this->type === 'boolean';
    }

    /**
     * Check if this is a limit feature.
     */
    public function isLimit(): bool
    {
        return $this->type === 'limit';
    }

    /**
     * Check if this is a text feature.
     */
    public function isText(): bool
    {
        return $this->type === 'text';
    }

    /**
     * Get boolean value.
     */
    public function getBooleanValue(): bool
    {
        return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get integer value (for limits).
     */
    public function getIntegerValue(): ?int
    {
        if ($this->value === 'unlimited' || $this->value === '-1') {
            return null; // Unlimited
        }

        return is_numeric($this->value) ? (int) $this->value : 0;
    }

    /**
     * Check if value is unlimited.
     */
    public function isUnlimited(): bool
    {
        return $this->value === 'unlimited' || $this->value === '-1';
    }

    /**
     * Get formatted value for display.
     */
    public function getFormattedValueAttribute(): string
    {
        if ($this->isBoolean()) {
            return $this->getBooleanValue() ? 'Yes' : 'No';
        }

        if ($this->isLimit() && $this->isUnlimited()) {
            return 'Unlimited';
        }

        return $this->value;
    }
}
