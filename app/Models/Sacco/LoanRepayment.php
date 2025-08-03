<?php

namespace App\Models\Sacco;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanRepayment extends Model
{
    protected $fillable = [
        'loan_id',
        'amount',
        'principal_portion',
        'interest_portion',
        'payment_date',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'principal_portion' => 'decimal:2',
        'interest_portion' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get total repayments for a loan
     */
    public static function getTotalForLoan(Loan $loan): float
    {
        return static::where('loan_id', $loan->id)->sum('amount');
    }

    /**
     * Get total interest paid for a loan
     */
    public static function getTotalInterestForLoan(Loan $loan): float
    {
        return static::where('loan_id', $loan->id)->sum('interest_portion');
    }

    /**
     * Get total principal paid for a loan
     */
    public static function getTotalPrincipalForLoan(Loan $loan): float
    {
        return static::where('loan_id', $loan->id)->sum('principal_portion');
    }
}
