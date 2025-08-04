<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareoutDecision extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'quarter_id',
        'wants_shareout',
        'savings_balance',
        'interest_amount',
        'shareout_completed',
        'decision_made_at',
        'shareout_completed_at',
        'completed_by',
    ];

    protected $casts = [
        'wants_shareout' => 'boolean',
        'shareout_completed' => 'boolean',
        'savings_balance' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'decision_made_at' => 'datetime',
        'shareout_completed_at' => 'datetime',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
