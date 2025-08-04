<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Loan;
use App\Models\Quarter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoanApplicationRestrictionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_active_loan_cannot_apply_for_new_loan()
    {
        // Create a user
        $user = User::factory()->create(['role' => 'member']);

        // Create an active quarter
        $quarter = Quarter::create([
            'name' => 'Q1 2025',
            'year' => 2025,
            'quarter_number' => 1,
            'start_date' => Carbon::now()->startOfMonth(),
            'end_date' => Carbon::now()->addMonths(3)->endOfMonth(),
            'status' => 'active'
        ]);

        // Create an active loan (disbursed status)
        Loan::create([
            'user_id' => $user->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L20250001',
            'amount' => 1000.00,
            'total_amount' => 1050.00,
            'amount_paid' => 0,
            'outstanding_balance' => 1050.00,
            'status' => 'disbursed',
            'purpose' => 'Test loan',
            'applied_date' => now(),
            'expected_repayment_date' => now()->addMonths(2),
            'repayment_period_months' => 2,
        ]);

        // Check that user has active loan
        $this->assertTrue($user->hasActiveLoan());
    }

    public function test_user_without_active_loan_can_check_loan_status()
    {
        // Create a user
        $user = User::factory()->create(['role' => 'member']);

        // User should not have active loan
        $this->assertFalse($user->hasActiveLoan());
    }

    public function test_user_with_completed_loan_can_apply_again()
    {
        // Create a user
        $user = User::factory()->create(['role' => 'member']);

        // Create an active quarter
        $quarter = Quarter::create([
            'name' => 'Q1 2025',
            'year' => 2025,
            'quarter_number' => 1,
            'start_date' => Carbon::now()->startOfMonth(),
            'end_date' => Carbon::now()->addMonths(3)->endOfMonth(),
            'status' => 'active'
        ]);

        // Create a completed loan
        Loan::create([
            'user_id' => $user->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L20250001',
            'amount' => 1000.00,
            'total_amount' => 1050.00,
            'amount_paid' => 1050.00,
            'outstanding_balance' => 0,
            'status' => 'completed',
            'purpose' => 'Test loan',
            'applied_date' => now()->subMonths(2),
            'expected_repayment_date' => now()->subDays(10),
            'actual_repayment_date' => now()->subDays(5),
            'repayment_period_months' => 2,
        ]);

        // User should not have active loan (completed loans don't count)
        $this->assertFalse($user->hasActiveLoan());
    }

    public function test_only_admin_can_approve_loans()
    {
        // Create users with different roles
        $admin = User::factory()->create(['role' => 'chairperson']);
        $secretary = User::factory()->create(['role' => 'secretary']);
        $member = User::factory()->create(['role' => 'member']);

        // Check approval permissions
        $this->assertTrue($admin->canApproveLoans());
        $this->assertFalse($secretary->canApproveLoans());
        $this->assertFalse($member->canApproveLoans());

        // Check admin status
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($secretary->isAdmin());
        $this->assertFalse($member->isAdmin());
    }
}
