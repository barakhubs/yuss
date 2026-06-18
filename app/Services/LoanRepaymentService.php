<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\LoanRepayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LoanRepaymentService
{
    /**
     * Calculate backfill/cumulative due for a given loan between start and end dates (inclusive)
     * Returns array with monthly_installment, installments_due, payments_recorded, cumulative_due
     */
    public function calculateBackfill(Loan $loan, Carbon $startDate, Carbon $endDate): array
    {
        if (!$loan->disbursed_date) {
            return [
                'monthly_installment' => 0,
                'installments_due' => 0,
                'payments_recorded' => 0,
                'cumulative_due' => 0,
            ];
        }

        $disbursed = Carbon::parse($loan->disbursed_date)->startOfMonth();
        $effectiveStart = $disbursed->greaterThan($startDate) ? $disbursed->copy() : $startDate->copy()->startOfMonth();
        $end = $endDate->copy()->startOfMonth();

        if ($effectiveStart->gt($end)) {
            return [
                'monthly_installment' => 0,
                'installments_due' => 0,
                'payments_recorded' => 0,
                'cumulative_due' => 0,
            ];
        }

        // Count months inclusive
        $months = $effectiveStart->diffInMonths($end) + 1;

        $repaymentMonths = max(1, $loan->repayment_period_months ?? 1);
        $monthlyInstallment = round($loan->total_amount / $repaymentMonths, 2);

        $expectedTotal = round($monthlyInstallment * min($months, $repaymentMonths), 2);

        $paymentsRecorded = $loan->repayments()
            ->whereBetween('payment_date', [$effectiveStart->startOfDay(), $end->endOfDay()])
            ->sum('amount');

        $cumulativeDue = max(0, $expectedTotal - $paymentsRecorded);
        $cumulativeDue = min($cumulativeDue, $loan->outstanding_balance);

        return [
            'monthly_installment' => $monthlyInstallment,
            'installments_due' => $months,
            'payments_recorded' => (float) $paymentsRecorded,
            'cumulative_due' => (float) $cumulativeDue,
        ];
    }

    /**
     * Create batch deductions for given loan ids (empty array = all active disbursed loans)
     * If dryRun is true, returns summary without persisting records.
     */
    public function createBatchDeductions(array $loanIds, Carbon $startDate, Carbon $endDate, bool $dryRun = true, $recordedBy = null): array
    {
        $query = Loan::where('status', 'disbursed')->where('outstanding_balance', '>', 0);
        if (!empty($loanIds)) {
            $query->whereIn('id', $loanIds);
        }

        $loans = $query->get();

        $summary = [
            'processed' => 0,
            'created_records' => 0,
            'details' => [],
        ];

        foreach ($loans as $loan) {
            $calc = $this->calculateBackfill($loan, $startDate, $endDate);
            if ($calc['cumulative_due'] <= 0) {
                $summary['details'][] = ['loan_id' => $loan->id, 'skipped' => true, 'reason' => 'no_due'];
                continue;
            }

            $amountToRecord = $calc['cumulative_due'];

            $summary['processed']++;

            if ($dryRun) {
                $summary['details'][] = [
                    'loan_id' => $loan->id,
                    'loan_number' => $loan->loan_number,
                    'member_name' => $loan->user?->name,
                    'amount' => $amountToRecord,
                    'dry_run' => true,
                ];
                continue;
            }

            // Persist within transaction and lock the loan row
            DB::transaction(function () use ($loan, $amountToRecord, $recordedBy, &$summary) {
                $lockedLoan = Loan::where('id', $loan->id)->lockForUpdate()->first();

                // Recalculate outstanding to avoid overcharging
                $amountToRecord = min($amountToRecord, $lockedLoan->outstanding_balance);

                $interestPortion = 0; // Simplified: full amount applied to principal after interest accounted earlier

                $repaymentData = [
                    'amount' => $amountToRecord,
                    'principal_portion' => $amountToRecord - $interestPortion,
                    'interest_portion' => $interestPortion,
                    'payment_date' => now(),
                    'payment_method' => 'auto-batch',
                    'notes' => 'Auto-batch deduction',
                ];

                if ($recordedBy && Schema::hasColumn('loan_repayments', 'recorded_by')) {
                    $repaymentData['recorded_by'] = $recordedBy;
                }

                $lockedLoan->repayments()->create($repaymentData);

                $lockedLoan->amount_paid = $lockedLoan->amount_paid + $amountToRecord;
                $lockedLoan->outstanding_balance = max(0, $lockedLoan->total_amount - $lockedLoan->amount_paid);
                if ($lockedLoan->outstanding_balance <= 0) {
                    $lockedLoan->status = 'completed';
                    $lockedLoan->actual_repayment_date = now();
                }
                $lockedLoan->save();

                $summary['created_records']++;
                $summary['details'][] = ['loan_id' => $loan->id, 'loan_number' => $loan->loan_number, 'amount' => $amountToRecord, 'dry_run' => false];
            });
        }

        return $summary;
    }
}
