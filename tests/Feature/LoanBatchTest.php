<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\User;
use App\Services\LoanRepaymentService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanBatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_schedule_returns_expected_months()
    {
        $this->withoutMiddleware();

        Carbon::setTestNow(Carbon::create(2026, 6, 15));

        $admin = User::factory()->create(['role' => 'chairperson']);
        $member = User::factory()->create();

        $quarter = \App\Models\Quarter::create([
            'name' => 'Q1 2026',
            'year' => 2026,
            'quarter_number' => 1,
            'start_date' => Carbon::create(2026, 1, 1)->toDateString(),
            'end_date' => Carbon::create(2026, 3, 31)->toDateString(),
            'status' => 'active',
        ]);

        $loan = Loan::create([
            'user_id' => $member->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L2026TEST0001',
            'loan_type' => 'savings_loan',
            'amount' => 1000,
            'total_amount' => 1100,
            'amount_paid' => 0,
            'outstanding_balance' => 1100,
            'status' => 'disbursed',
            'purpose' => 'Test loan',
            'applied_date' => Carbon::create(2026, 1, 15)->toDateString(),
            'expected_repayment_date' => Carbon::create(2026, 6, 30)->toDateString(),
            'repayment_period_months' => 6,
        ]);

        $service = app(LoanRepaymentService::class);
        $schedule = $service->calculateMonthlySchedule(
            $loan,
            Carbon::parse($loan->applied_date)->startOfMonth(),
            now()->startOfMonth()->subMonth()->endOfDay()
        );

        $this->assertNotEmpty($schedule);
        $this->assertEquals('2026-01', $schedule[0]['month_key']);
        $this->assertEquals('May 2026', $schedule[count($schedule) - 1]['month_label']);
        $this->assertCount(5, $schedule);
    }

    public function test_per_loan_batch_repay_dry_run_and_real_run()
    {
        $this->withoutMiddleware();

        Carbon::setTestNow(Carbon::create(2026, 6, 15));

        $admin = User::factory()->create(['role' => 'chairperson']);
        $member = User::factory()->create();

        $quarter = \App\Models\Quarter::create([
            'name' => 'Q1 2026',
            'year' => 2026,
            'quarter_number' => 1,
            'start_date' => Carbon::create(2026, 1, 1)->toDateString(),
            'end_date' => Carbon::create(2026, 3, 31)->toDateString(),
            'status' => 'active',
        ]);

        $loan = Loan::create([
            'user_id' => $member->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L2026TEST0002',
            'loan_type' => 'savings_loan',
            'amount' => 600,
            'total_amount' => 660,
            'amount_paid' => 0,
            'outstanding_balance' => 660,
            'purpose' => 'Test loan 2',
            'applied_date' => Carbon::create(2026, 1, 15)->toDateString(),
            'expected_repayment_date' => Carbon::create(2026, 4, 30)->toDateString(),
            'repayment_period_months' => 3,
        ]);
        $loan->status = 'disbursed';
        $loan->save();
        $loan->refresh();
        $this->assertSame('disbursed', $loan->status);

        $selectedMonths = ['2026-01', '2026-02'];
        $endpoint = "/sacco/loans/{$loan->id}/batch-repay";

        $dryResponse = $this->actingAs($admin)->postJson($endpoint, [
            'selected_months' => $selectedMonths,
            'dry_run' => true,
        ]);

        $dryResponse->assertStatus(200);
        $dryJson = $dryResponse->json();
        $this->assertTrue($dryJson['dry_run']);
        $this->assertCount(0, LoanRepayment::where('loan_id', $loan->id)->get());

        $realResponse = $this->actingAs($admin)->postJson($endpoint, [
            'selected_months' => $selectedMonths,
            'dry_run' => false,
        ]);

        $realResponse->assertStatus(200);
        $realJson = $realResponse->json();
        $this->assertFalse($realJson['dry_run']);
        $this->assertGreaterThan(0, LoanRepayment::where('loan_id', $loan->id)->count());

        $loan->refresh();
        $this->assertLessThan(660, $loan->outstanding_balance);
        $this->assertCount(2, $realJson['summary']['processed_months']);
    }
}
