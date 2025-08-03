<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'sacco_year_id',
        'loan_number',
        'principal_amount',
        'interest_rate',
        'total_amount',
        'amount_paid',
        'outstanding_balance',
        'status',
        'purpose',
        'admin_notes',
        'applied_date',
        'approved_date',
        'approved_by',
        'disbursed_date',
        'expected_repayment_date',
        'actual_repayment_date',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'applied_date' => 'date',
        'approved_date' => 'date',
        'disbursed_date' => 'date',
        'expected_repayment_date' => 'date',
        'actual_repayment_date' => 'date',
    ];

    public const STATUSES = [
        'pending' => 'Pending Approval',
        'approved' => 'Approved',
        'disbursed' => 'Disbursed',
        'repaid' => 'Fully Repaid',
        'defaulted' => 'Defaulted',
        'rejected' => 'Rejected',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function saccoYear(): BelongsTo
    {
        return $this->belongsTo(SaccoYear::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    public function interestDistributions(): HasMany
    {
        return $this->hasMany(InterestDistribution::class);
    }

    /**
     * Generate unique loan number
     */
    public static function generateLoanNumber(): string
    {
        do {
            $number = 'LN-' . date('Y') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (static::where('loan_number', $number)->exists());

        return $number;
    }

    /**
     * Calculate total amount with interest
     */
    public function calculateTotalAmount(): void
    {
        $interestAmount = ($this->principal_amount * $this->interest_rate) / 100;
        $this->total_amount = $this->principal_amount + $interestAmount;
        $this->outstanding_balance = $this->total_amount - $this->amount_paid;
    }

    /**
     * Approve the loan
     */
    public function approve(User $approver): void
    {
        $this->update([
            'status' => 'approved',
            'approved_date' => now(),
            'approved_by' => $approver->id,
        ]);
    }

    /**
     * Reject the loan
     */
    public function reject(string $reason = null): void
    {
        $this->update([
            'status' => 'rejected',
            'admin_notes' => $reason,
        ]);
    }

    /**
     * Disburse the loan
     */
    public function disburse(): void
    {
        $this->update([
            'status' => 'disbursed',
            'disbursed_date' => now(),
        ]);
    }

    /**
     * Record a repayment
     */
    public function recordRepayment(float $amount, string $paymentMethod = null, string $notes = null): LoanRepayment
    {
        // Calculate interest and principal portions
        $remainingInterest = $this->getInterestAmount() - $this->repayments()->sum('interest_portion');
        $interestPortion = min($amount, max(0, $remainingInterest));
        $principalPortion = $amount - $interestPortion;

        $repayment = $this->repayments()->create([
            'amount' => $amount,
            'principal_portion' => $principalPortion,
            'interest_portion' => $interestPortion,
            'payment_date' => now(),
            'payment_method' => $paymentMethod,
            'notes' => $notes,
        ]);

        // Update loan amounts
        $this->amount_paid += $amount;
        $this->outstanding_balance = $this->total_amount - $this->amount_paid;

        // Check if fully repaid
        if ($this->outstanding_balance <= 0) {
            $this->status = 'repaid';
            $this->actual_repayment_date = now();

            // Distribute interest
            $this->distributeInterest();
        }

        $this->save();

        return $repayment;
    }

    /**
     * Get interest amount
     */
    public function getInterestAmount(): float
    {
        return $this->total_amount - $this->principal_amount;
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayName(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Distribute interest when loan is fully repaid
     */
    protected function distributeInterest(): void
    {
        $interestAmount = $this->getInterestAmount();

        // 50% goes back to loan bearer
        $bearerAmount = $interestAmount * 0.5;
        $this->interestDistributions()->create([
            'organization_id' => $this->organization_id,
            'sacco_year_id' => $this->sacco_year_id,
            'user_id' => $this->user_id,
            'amount' => $bearerAmount,
            'distribution_type' => 'loan_bearer_return',
            'description' => '50% interest return to loan bearer',
            'distributed_date' => now(),
        ]);

        // Remaining 50% is kept for year-end distribution
        // This will be distributed at year-end among committee and members
    }

    /**
     * Scope for pending loans
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved loans
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for active loans (disbursed but not fully repaid)
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'disbursed');
    }

    /**
     * Scope for unpaid loans (disbursed with outstanding balance)
     */
    public function scopeUnpaid($query)
    {
        return $query->where('status', 'disbursed')
            ->where('outstanding_balance', '>', 0);
    }
}
