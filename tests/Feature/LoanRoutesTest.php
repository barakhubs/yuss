<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Quarter;
use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoanRoutesTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $admin;
    protected $quarter;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->user = User::factory()->create(['role' => 'member']);
        $this->admin = User::factory()->create(['role' => 'chairperson']);

        // Create active quarter
        $this->quarter = Quarter::create([
            'name' => 'Q1 2025',
            'year' => 2025,
            'quarter_number' => 1,
            'start_date' => Carbon::now()->startOfMonth(),
            'end_date' => Carbon::now()->addMonths(3)->endOfMonth(),
            'status' => 'active'
        ]);
    }

    public function test_loan_index_page_loads_for_authenticated_user()
    {
        $response = $this->actingAs($this->user)
            ->get('/sacco/loans');

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page->component('Sacco/Loans/Index'));
    }

    public function test_loan_create_page_loads_for_user_without_active_loan()
    {
        $response = $this->actingAs($this->user)
            ->get('/sacco/loans/create');

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('Sacco/Loans/Create')
                ->has('availableRepaymentPeriods')
                ->has('maxRepaymentMonths')
                ->has('quarterEndDate')
        );
    }

    public function test_loan_create_redirects_user_with_active_loan()
    {
        // Create an active loan for the user
        Loan::create([
            'user_id' => $this->user->id,
            'quarter_id' => $this->quarter->id,
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

        $response = $this->actingAs($this->user)
            ->get('/sacco/loans/create');

        $response->assertRedirect('/sacco/loans')
            ->assertSessionHas('error');
    }

    public function test_user_can_submit_loan_application()
    {
        $response = $this->actingAs($this->user)
            ->post('/sacco/loans', [
                'amount' => 1000,
                'purpose' => 'Business expansion',
                'repayment_period_months' => 2,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('loans', [
            'user_id' => $this->user->id,
            'amount' => 1000,
            'purpose' => 'Business expansion',
            'repayment_period_months' => 2,
            'status' => 'pending',
        ]);
    }

    public function test_user_cannot_submit_loan_with_active_loan()
    {
        // Create an active loan for the user
        Loan::create([
            'user_id' => $this->user->id,
            'quarter_id' => $this->quarter->id,
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

        $response = $this->actingAs($this->user)
            ->post('/sacco/loans', [
                'amount' => 1000,
                'purpose' => 'Business expansion',
                'repayment_period_months' => 2,
            ]);

        $response->assertRedirect('/sacco/loans')
            ->assertSessionHas('error');
    }

    public function test_admin_can_approve_loan()
    {
        $loan = Loan::create([
            'user_id' => $this->user->id,
            'quarter_id' => $this->quarter->id,
            'loan_number' => 'L20250001',
            'amount' => 1000.00,
            'total_amount' => 1050.00,
            'amount_paid' => 0,
            'outstanding_balance' => 1050.00,
            'status' => 'pending',
            'purpose' => 'Test loan',
            'applied_date' => now(),
            'expected_repayment_date' => now()->addMonths(2),
            'repayment_period_months' => 2,
        ]);

        $response = $this->actingAs($this->admin)
            ->post("/sacco/loans/{$loan->id}/approve", [
                'admin_notes' => 'Approved for good standing'
            ]);

        $response->assertRedirect();

        $loan->refresh();
        $this->assertEquals('approved', $loan->status);
        $this->assertEquals($this->admin->id, $loan->approved_by);
    }

    public function test_non_admin_cannot_approve_loan()
    {
        $loan = Loan::create([
            'user_id' => $this->user->id,
            'quarter_id' => $this->quarter->id,
            'loan_number' => 'L20250001',
            'amount' => 1000.00,
            'total_amount' => 1050.00,
            'amount_paid' => 0,
            'outstanding_balance' => 1050.00,
            'status' => 'pending',
            'purpose' => 'Test loan',
            'applied_date' => now(),
            'expected_repayment_date' => now()->addMonths(2),
            'repayment_period_months' => 2,
        ]);

        $response = $this->actingAs($this->user)
            ->post("/sacco/loans/{$loan->id}/approve");

        $response->assertStatus(403);
    }

    public function test_loan_show_page_loads()
    {
        $loan = Loan::create([
            'user_id' => $this->user->id,
            'quarter_id' => $this->quarter->id,
            'loan_number' => 'L20250001',
            'amount' => 1000.00,
            'total_amount' => 1050.00,
            'amount_paid' => 0,
            'outstanding_balance' => 1050.00,
            'status' => 'pending',
            'purpose' => 'Test loan',
            'applied_date' => now(),
            'expected_repayment_date' => now()->addMonths(2),
            'repayment_period_months' => 2,
        ]);

        $response = $this->actingAs($this->user)
            ->get("/sacco/loans/{$loan->id}");

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('Sacco/Loans/Show')
                ->where('loan.id', $loan->id)
        );
    }
}
