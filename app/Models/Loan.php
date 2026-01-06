<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'quarter_id',
        'loan_number',
        'loan_type',
        'amount',
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
        'repayment_deadline_quarter_id',
        'repayment_period_months',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'applied_date' => 'date',
        'approved_date' => 'date',
        'disbursed_date' => 'date',
        'expected_repayment_date' => 'date',
        'actual_repayment_date' => 'date',
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
     * Get the fixed interest rate for loans
     */
    public function getInterestRate(): float
    {
        return 5.00; // Fixed 5% interest rate
    }

    /**
     * Calculate interest amount
     */
    public function getInterestAmount(): float
    {
        return $this->amount * ($this->getInterestRate() / 100);
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

    /**
     * Calculate repayment date using the 22nd day rule
     *
     * @param \Carbon\Carbon $applicationDate The date the loan is applied for
     * @param int $repaymentPeriodMonths Number of months for repayment
     * @return \Carbon\Carbon The calculated repayment date
     */
    public static function calculateRepaymentDate(\Carbon\Carbon $applicationDate, int $repaymentPeriodMonths): \Carbon\Carbon
    {
        if ($repaymentPeriodMonths == 1 && $applicationDate->day < 22) {
            // 22nd day rule: loans taken before 22nd can be repaid in the same month
            return $applicationDate->copy()->endOfMonth();
        } else {
            // Standard logic: add months and set to end of month
            return $applicationDate->copy()->addMonths($repaymentPeriodMonths)->endOfMonth();
        }
    }
}
