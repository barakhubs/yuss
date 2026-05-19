<?php

namespace App\Console\Commands\Sacco;

use App\Models\Loan;
use App\Models\LoanRepayment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoRepayLoans extends Command
{
    protected $signature   = 'sacco:auto-repay-loans {--dry-run : Preview deductions without saving}';
    protected $description = 'Automatically deduct monthly loan repayments for all disbursed loans (runs daily, checks 30-day cycle)';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $this->info($isDryRun ? '[DRY RUN] Checking auto-repayments...' : 'Processing auto-repayments...');

        $loans = Loan::with(['user', 'repayments'])
            ->where('status', 'disbursed')
            ->where('outstanding_balance', '>', 0)
            ->whereNotNull('disbursed_date')
            ->whereNotNull('repayment_period_months')
            ->get();

        if ($loans->isEmpty()) {
            $this->info('No active disbursed loans found.');
            return self::SUCCESS;
        }

        $processed = 0;
        $skipped   = 0;

        foreach ($loans as $loan) {
            try {
                $result = $this->processLoan($loan, $isDryRun);
                if ($result) {
                    $processed++;
                } else {
                    $skipped++;
                }
            } catch (\Throwable $e) {
                Log::error("AutoRepayLoans: failed for loan {$loan->loan_number}", [
                    'error' => $e->getMessage(),
                    'loan_id' => $loan->id,
                ]);
                $this->error("  Error on loan {$loan->loan_number}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Processed: {$processed}, Skipped (not due): {$skipped}.");
        return self::SUCCESS;
    }

    private function processLoan(Loan $loan, bool $isDryRun): bool
    {
        $disbursedDate = Carbon::parse($loan->disbursed_date);

        // Count how many auto-deductions have already been recorded for this loan
        $autoCount = $loan->repayments()
            ->where('notes', 'like', 'Monthly auto-deduction%')
            ->count();

        // Check if we've already reached the max deductions
        if ($autoCount >= $loan->repayment_period_months) {
            return false;
        }

        // Next deduction is due 30 days × (autoCount + 1) after disbursement
        $nextDueDate = $disbursedDate->copy()->addDays(30 * ($autoCount + 1));

        if ($nextDueDate->isAfter(now())) {
            return false; // Not due yet
        }

        // Calculate monthly instalment
        $monthlyInstalment = round($loan->total_amount / $loan->repayment_period_months, 2);

        // Don't overpay — cap at outstanding balance
        $deductionAmount = min($monthlyInstalment, (float) $loan->outstanding_balance);

        if ($deductionAmount <= 0) {
            return false;
        }

        // Split into interest and principal portions
        // Remaining interest = total_amount - amount (principal) = total interest; divide evenly
        $totalInterest   = (float) $loan->total_amount - (float) $loan->amount;
        $interestPerMonth = $loan->repayment_period_months > 0
            ? round($totalInterest / $loan->repayment_period_months, 2)
            : 0;

        // Remaining interest we haven't paid yet
        $paidInterest     = $loan->repayments()->sum('interest_portion');
        $remainingInterest = max(0, $totalInterest - (float) $paidInterest);
        $interestPortion  = min($interestPerMonth, $remainingInterest, $deductionAmount);
        $principalPortion = round($deductionAmount - $interestPortion, 2);

        $deductionNumber = $autoCount + 1;
        $notes = "Monthly auto-deduction #{$deductionNumber} of {$loan->repayment_period_months} (disbursed {$disbursedDate->toDateString()})";

        $this->line("  {$loan->loan_number} ({$loan->user->name}): deducting €{$deductionAmount} [#{$deductionNumber}]");

        if ($isDryRun) {
            return true;
        }

        DB::transaction(function () use ($loan, $deductionAmount, $principalPortion, $interestPortion, $notes) {
            LoanRepayment::create([
                'loan_id'          => $loan->id,
                'amount'           => $deductionAmount,
                'principal_portion' => $principalPortion,
                'interest_portion' => $interestPortion,
                'payment_date'     => now()->toDateString(),
                'payment_method'   => 'auto_deduction',
                'recorded_by'      => null,
                'notes'            => $notes,
            ]);

            $newAmountPaid       = (float) $loan->amount_paid + $deductionAmount;
            $newOutstandingBalance = max(0, (float) $loan->outstanding_balance - $deductionAmount);
            $newStatus           = $newOutstandingBalance <= 0 ? 'completed' : 'disbursed';

            $updateData = [
                'amount_paid'         => $newAmountPaid,
                'outstanding_balance' => $newOutstandingBalance,
                'status'              => $newStatus,
            ];

            if ($newStatus === 'completed') {
                $updateData['actual_repayment_date'] = now()->toDateString();
            }

            $loan->update($updateData);
        });

        return true;
    }
}
