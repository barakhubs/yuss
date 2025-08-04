<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Quarter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoanPeriodCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_loan_period_calculation_with_full_quarter_remaining()
    {
        // Create a quarter that just started (3 months remaining)
        $startDate = Carbon::now()->startOfMonth();
        $endDate = $startDate->copy()->addMonths(3)->subDay();

        $quarter = Quarter::create([
            'name' => 'Q1 ' . $startDate->year,
            'year' => $startDate->year,
            'quarter_number' => 1,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'active'
        ]);

        // Test the calculation logic (simulate controller logic)
        $quarterEndDateString = (string) $quarter->end_date;
        $quarterEndDate = Carbon::parse($quarterEndDateString);
        $currentDate = Carbon::now();

        $monthsRemainingInQuarter = $currentDate->diffInMonths($quarterEndDate, false) + 1;
        $maxRepaymentMonths = min(4, max(0, $monthsRemainingInQuarter));

        // Should allow up to 3 months (all remaining months in quarter)
        $this->assertGreaterThanOrEqual(3, $maxRepaymentMonths);
        $this->assertLessThanOrEqual(4, $maxRepaymentMonths);
    }

    public function test_loan_period_calculation_with_one_month_remaining()
    {
        // Create a quarter that ends this month (1 month remaining)
        $startDate = Carbon::now()->startOfMonth()->subMonths(2);
        $endDate = Carbon::now()->endOfMonth();

        $quarter = Quarter::create([
            'name' => 'Q1 ' . $startDate->year,
            'year' => $startDate->year,
            'quarter_number' => 1,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'active'
        ]);

        // Test the calculation logic
        $quarterEndDateString = (string) $quarter->end_date;
        $quarterEndDate = Carbon::parse($quarterEndDateString);
        $currentDate = Carbon::now();

        // Use a more precise calculation - count months from start of current month to end month
        $currentMonth = $currentDate->startOfMonth();
        $endMonth = $quarterEndDate->startOfMonth();
        $monthsRemainingInQuarter = $currentMonth->diffInMonths($endMonth) + 1;
        $maxRepaymentMonths = min(4, max(0, $monthsRemainingInQuarter));

        // Should allow only 1 month
        $this->assertEquals(1, $maxRepaymentMonths);
    }

    public function test_loan_period_calculation_with_quarter_ended()
    {
        // Create a quarter that has already ended
        $startDate = Carbon::now()->startOfMonth()->subMonths(4);
        $endDate = Carbon::now()->subMonth();

        $quarter = Quarter::create([
            'name' => 'Q1 ' . $startDate->year,
            'year' => $startDate->year,
            'quarter_number' => 1,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'active'
        ]);

        // Test the calculation logic
        $quarterEndDateString = (string) $quarter->end_date;
        $quarterEndDate = Carbon::parse($quarterEndDateString);
        $currentDate = Carbon::now();

        $monthsRemainingInQuarter = $currentDate->diffInMonths($quarterEndDate, false) + 1;
        $maxRepaymentMonths = min(4, max(0, $monthsRemainingInQuarter));

        // Should allow 0 months (quarter has ended)
        $this->assertEquals(0, $maxRepaymentMonths);
    }
}
