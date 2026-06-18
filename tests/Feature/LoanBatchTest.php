<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanBatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_batch_preview_returns_cumulative_due()
    {
        $this->withoutMiddleware();

        $admin = User::factory()->create(['role' => 'chairperson']);
        $member = User::factory()->create();

        $disbursedDate = Carbon::create(now()->year, 1, 15)->startOfDay();
        $quarter = \App\Models\Quarter::create([
            'name' => 'Q1 ' . now()->year,
            'year' => now()->year,
            'quarter_number' => 1,
            'start_date' => Carbon::create(now()->year, 1, 1)->toDateString(),
            'end_date' => Carbon::create(now()->year, 3, 31)->toDateString(),
            'status' => 'active',
        ]);
        $loan = Loan::create([
            'user_id' => $member->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L2026TEST0001',
            'loan_type' => 'savings_loan',
            'amount' => 1000,
            'total_amount' => 1100, // includes interest
            'amount_paid' => 0,
            'outstanding_balance' => 1100,
            'status' => 'disbursed',
            'purpose' => 'Test loan',
            'disbursed_date' => $disbursedDate->toDateString(),
            'expected_repayment_date' => $disbursedDate->copy()->addMonths(6)->endOfMonth()->toDateString(),
            'repayment_period_months' => 6,
            'applied_date' => now()->toDateString(),
        ]);

        // Simulate one repayment in Feb
        LoanRepayment::create([
            'loan_id' => $loan->id,
            'amount' => 183.33,
            'principal_portion' => 170.00,
            'interest_portion' => 13.33,
            'payment_date' => Carbon::create(now()->year, 2, 15)->toDateString(),
            'payment_method' => 'manual',
        ]);

        $response = $this->actingAs($admin)->getJson('/sacco/loans/batch-preview?start_year=' . now()->year . '&exclude_current=1&scope=all');

        // Dump response for debugging when JSON is invalid
        try {
            $content = $response->getContent();
            @file_put_contents(base_path('tmp_preview_response.txt'), $content);
        } catch (\Throwable $e) {
            // ignore
        }

        $response->assertStatus(200);
        $json = $response->json();

        $this->assertArrayHasKey('data', $json);
        $this->assertCount(1, $json['data']);

        $item = $json['data'][0];
        $this->assertArrayHasKey('cumulative_due', $item);
        $this->assertGreaterThanOrEqual(0, $item['cumulative_due']);
    }

    public function test_batch_run_dry_run_and_real_run()
    {
        $this->withoutMiddleware();

        $admin = User::factory()->create(['role' => 'chairperson']);
        $member = User::factory()->create();

        $disbursedDate = Carbon::create(now()->year, 1, 15)->startOfDay();
        $quarter = \App\Models\Quarter::create([
            'name' => 'Q1 ' . now()->year,
            'year' => now()->year,
            'quarter_number' => 1,
            'start_date' => Carbon::create(now()->year, 1, 1)->toDateString(),
            'end_date' => Carbon::create(now()->year, 3, 31)->toDateString(),
            'status' => 'active',
        ]);

        $loan = Loan::create([
            'user_id' => $member->id,
            'quarter_id' => $quarter->id,
            'loan_number' => 'L2026TEST0002',
            'loan_type' => 'savings_loan',
            'amount' => 600,
            'total_amount' => 660, // includes interest
            'amount_paid' => 0,
            'outstanding_balance' => 660,
            'status' => 'disbursed',
            'purpose' => 'Test loan 2',
            'disbursed_date' => $disbursedDate->toDateString(),
            'expected_repayment_date' => $disbursedDate->copy()->addMonths(3)->endOfMonth()->toDateString(),
            'repayment_period_months' => 3,
            'applied_date' => now()->toDateString(),
        ]);

        // Dry run: should not create repayments
        $dryResponse = $this->actingAs($admin)->postJson('/sacco/loans/batch-run', [
            'loan_ids' => [$loan->id],
            'start_year' => now()->year,
            'exclude_current' => true,
            'dry_run' => true,
        ]);

        $dryResponse->assertStatus(200);
        $dryJson = $dryResponse->json();
        $this->assertTrue($dryJson['dry_run']);
        $this->assertEquals(0, LoanRepayment::where('loan_id', $loan->id)->count());

        // Real run: create repayments
        $realResponse = $this->actingAs($admin)->postJson('/sacco/loans/batch-run', [
            'loan_ids' => [$loan->id],
            'start_year' => now()->year,
            'exclude_current' => true,
            'dry_run' => false,
        ]);

        $realResponse->assertStatus(200);
        $realJson = $realResponse->json();
        $this->assertFalse($realJson['dry_run']);
        $this->assertGreaterThan(0, LoanRepayment::where('loan_id', $loan->id)->count());

        $loan->refresh();
        $this->assertLessThanOrEqual(660, $loan->outstanding_balance);
    }
}
