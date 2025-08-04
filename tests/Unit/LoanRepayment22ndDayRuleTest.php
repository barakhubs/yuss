<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Loan;
use Carbon\Carbon;

class LoanRepayment22ndDayRuleTest extends TestCase
{
    public function test_22nd_day_rule_examples()
    {
        // Example 1: Loan taken on August 10th (before 22nd) with 1-month repayment
        $applicationDate = Carbon::create(2025, 8, 10);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 1);
        $this->assertEquals('2025-08-31', $repaymentDate->format('Y-m-d'));

        // Example 2: Loan taken on August 22nd (on/after 22nd) with 1-month repayment
        $applicationDate = Carbon::create(2025, 8, 22);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 1);
        $this->assertEquals('2025-09-30', $repaymentDate->format('Y-m-d'));

        // Example 3: Loan taken on August 25th (after 22nd) with 1-month repayment
        $applicationDate = Carbon::create(2025, 8, 25);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 1);
        $this->assertEquals('2025-09-30', $repaymentDate->format('Y-m-d'));

        // Example 4: Multi-month loans are not affected by 22nd day rule
        $applicationDate = Carbon::create(2025, 8, 10);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 2);
        $this->assertEquals('2025-10-31', $repaymentDate->format('Y-m-d'));

        // Example 5: Multi-month loans taken after 22nd
        $applicationDate = Carbon::create(2025, 8, 25);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 3);
        $this->assertEquals('2025-11-30', $repaymentDate->format('Y-m-d'));

        // Example 6: End of month behavior for February (28 days)
        $applicationDate = Carbon::create(2025, 2, 15);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 1);
        $this->assertEquals('2025-02-28', $repaymentDate->format('Y-m-d'));

        // Example 7: February to March transition
        $applicationDate = Carbon::create(2025, 2, 25);
        $repaymentDate = Loan::calculateRepaymentDate($applicationDate, 1);
        $this->assertEquals('2025-03-31', $repaymentDate->format('Y-m-d'));
    }
}
