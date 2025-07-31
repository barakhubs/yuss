<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_period',
        'legacy_stripe_price_id',
        'paddle_price_id',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });

        static::updating(function ($plan) {
            if ($plan->isDirty('name') && empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });
    }

    /**
     * Get the features for this plan.
     */
    public function features()
    {
        return $this->hasMany(PlanFeature::class)->orderBy('sort_order');
    }

    /**
     * Get active plans.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get featured plans.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Order plans by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }

    /**
     * Get formatted price.
     */
    public function getFormattedPriceAttribute()
    {
        return '$' . number_format((float) $this->price, 2);
    }

    /**
     * Get billing period text.
     */
    public function getBillingPeriodTextAttribute()
    {
        return $this->billing_period === 'yearly' ? 'per year' : 'per month';
    }

    /**
     * Check if plan has a specific feature.
     */
    public function hasFeature(string $slug): bool
    {
        return $this->features()->where('slug', $slug)->exists();
    }

    /**
     * Get a specific feature value.
     */
    public function getFeature(string $slug): ?PlanFeature
    {
        return $this->features()->where('slug', $slug)->first();
    }

    /**
     * Get feature value as string.
     */
    public function getFeatureValue(string $slug): ?string
    {
        $feature = $this->getFeature($slug);
        return $feature?->value;
    }

    /**
     * Check if feature value is unlimited.
     */
    public function isFeatureUnlimited(string $slug): bool
    {
        $value = $this->getFeatureValue($slug);
        return $value === 'unlimited' || $value === '-1';
    }

    /**
     * Get feature value as integer (for limits).
     */
    public function getFeatureLimit(string $slug): ?int
    {
        $value = $this->getFeatureValue($slug);

        if ($this->isFeatureUnlimited($slug)) {
            return null; // Unlimited
        }

        return is_numeric($value) ? (int) $value : null;
    }
}
