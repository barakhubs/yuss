<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WelfareClaim extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'claimed_by',
        'claim_type',
        'event_date',
        'beneficiary_name',
        'notes',
        'group_contribution',
        'yukon_contribution',
        'total_payout',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'event_date' => 'date',
        'paid_at' => 'datetime',
        'group_contribution' => 'decimal:2',
        'yukon_contribution' => 'decimal:2',
        'total_payout' => 'decimal:2',
    ];

    protected $keyType = 'string';
    public $incrementing = false;

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
