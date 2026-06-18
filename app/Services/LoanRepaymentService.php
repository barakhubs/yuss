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

    private function getLoanMonthlyInstallment(Loan $loan): float
    {
        $repaymentMonths = max(1, $loan->repayment_period_months ?? 1);
        return round($loan->total_amount / $repaymentMonths, 2);
    }

    public function calculateMonthlySchedule(Loan $loan, Carbon $startDate, Carbon $endDate): array
    {
        if (!$loan->applied_date) {
            return [];
        }

        $start = Carbon::parse($loan->applied_date)->startOfMonth();
        if ($startDate->gt($start)) {
            $start = $startDate->copy()->startOfMonth();
        }

        $end = $endDate->copy()->endOfMonth();

        if ($loan->expected_repayment_date) {
            $expectedEnd = Carbon::parse($loan->expected_repayment_date)->endOfMonth();
            if ($expectedEnd->lt($end)) {
                $end = $expectedEnd;
            }
        }

        if ($start->gt($end)) {
            return [];
        }

        $monthlyInstallment = $this->getLoanMonthlyInstallment($loan);
        $months = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd = $cursor->copy()->endOfMonth();
            $paymentsRecorded = $loan->repayments()
                ->whereBetween('payment_date', [$monthStart->startOfDay(), $monthEnd->endOfDay()])
                ->sum('amount');

            $months[] = [
                'month_key' => $monthStart->format('Y-m'),
                'month_label' => $monthStart->format('M Y'),
                'payment_date' => $monthEnd->toDateString(),
                'monthly_installment' => $monthlyInstallment,
                'payments_recorded' => (float) $paymentsRecorded,
                'already_paid' => $paymentsRecorded > 0,
            ];

            $cursor->addMonth();
        }

        return $months;
    }

    public function createRepaymentsForLoan(Loan $loan, array $selectedMonths, bool $dryRun = true, $recordedBy = null, bool $suppressNotifications = true): array
    {
        $now = Carbon::now();
        $startDate = Carbon::parse($loan->applied_date)->startOfMonth();
        $endDate = $now->copy()->startOfMonth()->subMonth()->endOfDay();
        $schedule = $this->calculateMonthlySchedule($loan, $startDate, $endDate);
        $availableKeys = array_column($schedule, 'month_key');

        $selectedMonths = array_values(array_unique($selectedMonths));
        foreach ($selectedMonths as $monthKey) {
            if (!in_array($monthKey, $availableKeys, true)) {
                throw new \InvalidArgumentException('Invalid repayment month selected: ' . $monthKey);
            }
        }

        $selectedMonths = array_values(array_filter($selectedMonths, fn($month) => in_array($month, $availableKeys, true)));
        sort($selectedMonths);

        $summary = [
            'loan_id' => $loan->id,
            'loan_number' => $loan->loan_number,
            'dry_run' => $dryRun,
            'selected_months' => $selectedMonths,
            'processed_months' => [],
            'skipped_months' => [],
            'total_amount' => 0.0,
            'created_records' => 0,
        ];

        $process = function (Loan $lockedLoan) use ($selectedMonths, $schedule, &$summary, $recordedBy, $dryRun) {
            $monthlyInstallment = $this->getLoanMonthlyInstallment($lockedLoan);
            $interestRate = $lockedLoan->getInterestRate() / 100;
            $interestAmount = $lockedLoan->amount * $interestRate;
            $alreadyPaidInterest = (float) $lockedLoan->repayments()->sum('interest_portion');
            $amountPaid = (float) $lockedLoan->amount_paid;
            $outstanding = (float) $lockedLoan->outstanding_balance;
            $createdCount = 0;

            foreach ($schedule as $month) {
                if (!in_array($month['month_key'], $selectedMonths, true)) {
                    continue;
                }

                if ($month['already_paid']) {
                    $summary['skipped_months'][] = [
                        'month_key' => $month['month_key'],
                        'reason' => 'already_paid',
                    ];
                    continue;
                }

                if ($outstanding <= 0) {
                    $summary['skipped_months'][] = [
                        'month_key' => $month['month_key'],
                        'reason' => 'loan_fully_paid',
                    ];
                    continue;
                }

                $amountToRecord = min($monthlyInstallment, $outstanding);
                $remainingInterest = max(0, $interestAmount - $alreadyPaidInterest);
                $interestPortion = min($amountToRecord, $remainingInterest);
                $principalPortion = $amountToRecord - $interestPortion;
                $paymentDate = Carbon::parse($month['payment_date']);

                $entry = [
                    'month_key' => $month['month_key'],
                    'payment_date' => $paymentDate->toDateString(),
                    'amount' => $amountToRecord,
                    'principal_portion' => $principalPortion,
                    'interest_portion' => $interestPortion,
                ];

                if (!$dryRun) {
                    $repaymentData = [
                        'amount' => $amountToRecord,
                        'principal_portion' => $principalPortion,
                        'interest_portion' => $interestPortion,
                        'payment_date' => $paymentDate->toDateString(),
                        'payment_method' => 'auto-batch',
                        'notes' => 'Auto-batch deduction (selected months)',
                    ];

                    if ($recordedBy && Schema::hasColumn('loan_repayments', 'recorded_by')) {
                        $repaymentData['recorded_by'] = $recordedBy;
                    }

                    $lockedLoan->repayments()->create($repaymentData);
                }

                $amountPaid += $amountToRecord;
                $outstanding = max(0, $lockedLoan->total_amount - $amountPaid);
                $alreadyPaidInterest += $interestPortion;

                $summary['processed_months'][] = $entry;
                $summary['total_amount'] += $amountToRecord;
                $createdCount++;
            }

            if (!$dryRun) {
                $lockedLoan->amount_paid = $amountPaid;
                $lockedLoan->outstanding_balance = $outstanding;
                if ($outstanding <= 0) {
                    $lockedLoan->status = 'completed';
                    $lockedLoan->actual_repayment_date = Carbon::now();
                }
                $lockedLoan->save();
            }

            $summary['created_records'] = $createdCount;
        };

        if ($dryRun) {
            $tempLoan = clone $loan;
            $process($tempLoan);
        } else {
            DB::transaction(function () use ($loan, $process) {
                $lockedLoan = Loan::where('id', $loan->id)->lockForUpdate()->first();
                $process($lockedLoan);
            });
        }

        return $summary;
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

                // Calculate interest and principal portions following single-record flow
                $interestRate = $lockedLoan->getInterestRate() / 100;
                $interestAmount = $lockedLoan->amount * $interestRate;
                $alreadyPaidInterest = (float) $lockedLoan->repayments()->sum('interest_portion');
                $remainingInterest = max(0, $interestAmount - $alreadyPaidInterest);
                $interestPortion = min($amountToRecord, $remainingInterest);
                $principalPortion = $amountToRecord - $interestPortion;

                $repaymentData = [
                    'amount' => $amountToRecord,
                    'principal_portion' => $principalPortion,
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
