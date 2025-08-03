<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'quarter_id',
        'amount',
        'interest_rate',
        'total_amount',
        'outstanding_balance',
        'repayment_deadline_quarter_id',
        'status',
        'purpose',
        'application_date',
        'approval_date',
        'disbursement_date',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'application_date' => 'date',
        'approval_date' => 'datetime',
        'disbursement_date' => 'datetime',
    ];

    /**
     * Get the user who took the loan
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the quarter when loan was taken
     */
    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }

    /**
     * Get the deadline quarter for repayment
     */
    public function repaymentDeadlineQuarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class, 'repayment_deadline_quarter_id');
    }

    /**
     * Get the user who approved the loan
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get loan repayments
     */
    public function repayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    /**
     * Check if loan is fully repaid
     */
    public function isFullyRepaid(): bool
    {
        return $this->outstanding_balance <= 0;
    }

    /**
     * Check if loan is overdue
     */
    public function isOverdue(): bool
    {
        if ($this->status !== 'disbursed' || $this->isFullyRepaid()) {
            return false;
        }

        return $this->repaymentDeadlineQuarter &&
            $this->repaymentDeadlineQuarter->end_date < now();
    }

    /**
     * Get total repaid amount
     */
    public function getTotalRepaidAmount(): float
    {
        return $this->repayments()->sum('amount');
    }

    /**
     * Calculate interest amount
     */
    public function getInterestAmount(): float
    {
        return $this->amount * ($this->interest_rate / 100);
    }

    /**
     * Scope for active loans
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['approved', 'disbursed'])
            ->where('outstanding_balance', '>', 0);
    }

    /**
     * Scope for overdue loans
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'disbursed')
            ->where('outstanding_balance', '>', 0)
            ->whereHas('repaymentDeadlineQuarter', function ($q) {
                $q->where('end_date', '<', now());
            });
    }
}
