<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Quarter;
use App\Models\User;
use App\Notifications\NewLoanApplication;
use App\Notifications\LoanStatusChanged;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of loans
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->isAdmin();

        // Build query
        $query = Loan::with(['user', 'approver', 'quarter']);

        // If not admin, only show user's own loans
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        // Apply filters
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('purpose', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $loans = $query->latest()->paginate(10);

        // Get available quarters for filter
        $quarters = Quarter::orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->get();

        // Define status options
        $statuses = [
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'disbursed' => 'Disbursed',
            'repaid' => 'Repaid',
            'defaulted' => 'Defaulted',
        ];

        return Inertia::render('sacco/loans/Index', [
            'loans' => $loans,
            'isAdmin' => $isAdmin,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
            'quarters' => $quarters,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Show the form for creating a new loan
     */
    public function create()
    {
        $user = Auth::user();

        // Admin users cannot apply for loans
        if ($user->isAdmin()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'Admin users cannot apply for loans.');
        }

        // Check if user has a savings category assigned
        if (!$user->hasCategory()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You must have a savings category (A, B, or C) assigned by an administrator before applying for loans. Please contact the SACCO administrator.');
        }

        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active quarter found. Please contact an administrator.');
        }

        // Calculate available repayment months within the current quarter
        $quarterEndDateString = (string) $currentQuarter->end_date;
        $quarterEndDate = \Carbon\Carbon::parse($quarterEndDateString);
        $currentDate = now();

        // Calculate months from current month to December (end of sacco year)
        // Sacco year runs Jan to Dec - no loan should cross to next year
        $currentMonth = $currentDate->copy()->startOfMonth();
        $endOfYear = $currentDate->copy()->month(12)->endOfMonth(); // December 31st of current year

        // Calculate maximum months without crossing the year boundary
        // Example: November to December = 1 month (Nov + 1 = Dec)
        // Example: January to December = 11 months (Jan + 11 = Dec)
        $monthsToEndOfYear = 12 - $currentDate->month;

        // Minimum 1 month if we're in December and can use 22nd day rule
        if ($monthsToEndOfYear <= 0) {
            $monthsToEndOfYear = ($currentDate->day < 22) ? 1 : 0;
        }

        // For savings loans, max is from now to December
        // For other loans, it's always 1 month (set in config)
        $maxRepaymentMonths = $monthsToEndOfYear;

        // Generate available repayment periods and filter to ensure no loans cross into next year
        $availableRepaymentPeriods = [];
        for ($i = 1; $i <= $maxRepaymentMonths; $i++) {
            // Use the same calculation method as loan creation
            $repaymentDate = Loan::calculateRepaymentDate($currentDate, $i);

            // Ensure repayment date doesn't exceed December 31st of current year
            if ($repaymentDate->year <= $currentDate->year && $repaymentDate->month <= 12) {
                $availableRepaymentPeriods[] = [
                    'months' => $i,
                    'label' => $i . ' month' . ($i > 1 ? 's' : ''),
                    'repayment_date' => $repaymentDate->format('Y-m-d'),
                    'repayment_month' => $repaymentDate->format('F Y'),
                ];
            }
        }

        // If no repayment periods available, user can't apply
        if (empty($availableRepaymentPeriods)) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'No available repayment periods in the current quarter. Please wait for the next quarter.');
        }

        // Get user's loan limits based on category
        $loanTypes = [];
        $hasActiveLoan = $user->hasActiveLoan();

        if ($user->hasCategory()) {
            $savingsLoan = $user->getLoanLimits('savings_loan');
            $socialFundLoan = $user->getLoanLimits('social_fund_loan');
            $yukonWelfare = config('sacco.yukon_welfare.loans');
            $schoolFees = config('sacco.school_fees_loan');

            // Savings Loan - blocked if any active loan exists (except emergencies)
            if ($savingsLoan && $user->canApplyForLoan('savings_loan') && $user->canApplyForLoanType('savings_loan') && !$hasActiveLoan) {
                // Calculate maximum repayment months from now to December (end of sacco year)
                $savingsLoanMaxMonths = $monthsToEndOfYear;

                $loanTypes['savings_loan'] = [
                    'label' => 'Main Savings Loan',
                    'min' => $savingsLoan['min'],
                    'max' => $savingsLoan['max'],
                    'interest_rate' => $savingsLoan['interest_rate'],
                    'max_repayment_months' => $savingsLoanMaxMonths,
                    'description' => 'Borrow from your main savings at ' . $savingsLoan['interest_rate'] . '% per annum (up to ' . $savingsLoanMaxMonths . ' months, must be repaid by December)',
                ];
            }

            // Social Fund Loan - emergency loan, can be taken even with active loans
            if ($socialFundLoan) {
                $loanTypes['social_fund_loan'] = [
                    'label' => 'Social Fund (Emergency) Loan',
                    'min' => $socialFundLoan['min'],
                    'max' => $socialFundLoan['max'],
                    'interest_rate' => $socialFundLoan['interest_rate'],
                    'max_repayment_months' => $socialFundLoan['max_repayment_months'],
                    'description' => 'Emergency loan from social fund at ' . $socialFundLoan['interest_rate'] . '% per annum (1 month only) - Available even with active loans',
                ];
            }

            // Yukon Welfare Loan - blocked if any active loan exists (except emergencies)
            // Only available from March onwards
            $currentMonth = now()->month;
            $yukonStartMonth = $yukonWelfare['start_month'] ?? 1;
            if ($yukonWelfare && $user->canApplyForLoanType('yukon_welfare_loan') && !$hasActiveLoan && $currentMonth >= $yukonStartMonth) {
                $loanTypes['yukon_welfare_loan'] = [
                    'label' => 'Yukon Welfare Loan',
                    'min' => $yukonWelfare['min'],
                    'max' => $yukonWelfare['max'],
                    'interest_rate' => $yukonWelfare['interest_rate'],
                    'max_repayment_months' => $yukonWelfare['max_repayment_months'] ?? 1,
                    'description' => 'Borrow from Yukon staff fund at ' . $yukonWelfare['interest_rate'] . '% per annum (1 month repayment)',
                ];
            }

            // School Fees Loan - emergency loan, can be taken even with active loans
            if ($schoolFees) {
                $loanTypes['school_fees_loan'] = [
                    'label' => 'School Fees Loan (0% Interest)',
                    'min' => $schoolFees['min'],
                    'max' => $schoolFees['max'],
                    'interest_rate' => $schoolFees['interest_rate'],
                    'max_repayment_months' => $schoolFees['max_repayment_months'],
                    'description' => '0% interest loan for school fees (1 month repayment) - Available even with active loans',
                ];
            }
        }

        return Inertia::render('sacco/member/loans/Create', [
            'currentQuarter' => $currentQuarter,
            'availableRepaymentPeriods' => $availableRepaymentPeriods,
            'maxRepaymentMonths' => $maxRepaymentMonths,
            'quarterEndDate' => $quarterEndDate->format('F j, Y'),
            'userSavingsBalance' => $user->getCurrentSavingsBalance(),
            'loanTypes' => $loanTypes,
            'userCategory' => $user->savings_category,
        ]);
    }

    /**
     * Store a newly created loan
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Admin users cannot apply for loans
        if ($user->isAdmin()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'Admin users cannot apply for loans.');
        }

        // Check if user has a category
        if (!$user->hasCategory()) {
            return redirect()->back()
                ->with('error', 'You must have a savings category assigned before applying for a loan.');
        }

        // Check if user has active loan (except for emergency loan types)
        $isEmergencyLoan = in_array($request->loan_type, ['social_fund_loan', 'school_fees_loan']);
        if (!$isEmergencyLoan && $user->hasActiveLoan()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You cannot apply for a loan at this time. You have an existing active loan. Only emergency loans (Social Fund, School Fees) can be taken with active loans.');
        }

        $request->validate([
            'loan_type' => ['required', 'string', 'in:savings_loan,social_fund_loan,yukon_welfare_loan,school_fees_loan'],
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'purpose' => ['required', 'string', 'max:500'],
            'repayment_period_months' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        // Get loan limits and validate against user's category
        $loanType = $request->loan_type;

        if ($loanType === 'yukon_welfare_loan') {
            $loanLimits = config('sacco.yukon_welfare.loans');
        } elseif ($loanType === 'school_fees_loan') {
            $loanLimits = config('sacco.school_fees_loan');
        } else {
            $loanLimits = $user->getLoanLimits($loanType);
        }

        if (!$loanLimits) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Invalid loan type for your category.');
        }

        // Validate amount against limits
        if ($request->amount < $loanLimits['min'] || $request->amount > $loanLimits['max']) {
            return redirect()->back()
                ->withInput()
                ->with('error', "Loan amount must be between €{$loanLimits['min']} and €{$loanLimits['max']} for {$loanType}.");
        }

        // Check if user can apply for this loan type based on restrictions
        if (!$user->canApplyForLoanType($loanType)) {
            $conflictType = '';
            if ($loanType === 'savings_loan' && $user->hasActiveLoanOfType('yukon_welfare_loan')) {
                $conflictType = 'Yukon Welfare Loan';
            } elseif ($loanType === 'yukon_welfare_loan' && $user->hasActiveLoanOfType('savings_loan')) {
                $conflictType = 'Savings Loan';
            }

            return redirect()->back()
                ->withInput()
                ->with('error', "You cannot apply for this loan type while you have an active {$conflictType}.");
        }

        // Check if user can apply for this loan type at current date (only for category-specific loans)
        $globalLoanTypes = ['school_fees_loan', 'yukon_welfare_loan'];
        if (!in_array($loanType, $globalLoanTypes) && !$user->canApplyForLoan($loanType)) {
            $startMonth = $loanLimits['start_month'] ?? 1;
            $monthName = date('F', mktime(0, 0, 0, $startMonth, 1));
            return redirect()->back()
                ->withInput()
                ->with('error', "Category {$user->savings_category} members can apply for {$loanType} starting from {$monthName}.");
        }

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active quarter found for loan applications.');
        }

        // Calculate maximum repayment months (same logic as in create method)
        // Sacco year runs Jan to Dec - no loan should cross to next year
        $currentDate = now();

        // Calculate months from current month to December (end of sacco year)
        $monthsToEndOfYear = 12 - $currentDate->month;

        // Minimum 1 month if we're in December and can use 22nd day rule
        if ($monthsToEndOfYear <= 0) {
            $monthsToEndOfYear = ($currentDate->day < 22) ? 1 : 0;
        }

        // Apply loan type limits
        $maxRepaymentMonths = min($loanLimits['max_repayment_months'], max(0, $monthsToEndOfYear));

        // Validate the requested repayment period
        if ($request->repayment_period_months > $maxRepaymentMonths) {
            return redirect()->back()
                ->withInput()
                ->with('error', "Repayment period cannot exceed {$maxRepaymentMonths} months based on the current quarter timing and loan type.");
        }

        // Calculate expected repayment date with 22nd day rule
        $repaymentPeriodMonths = (int) $request->repayment_period_months;
        $expectedRepaymentDate = Loan::calculateRepaymentDate($currentDate, $repaymentPeriodMonths);

        // Pre-calculate total amount with interest based on loan type
        // Interest rate is annual (10% p.a.), so prorate based on loan duration
        $amount = (float) $request->amount;
        $annualInterestRate = $loanLimits['interest_rate'] / 100; // e.g., 10% = 0.10
        $proratedRate = ($annualInterestRate / 12) * $repaymentPeriodMonths; // e.g., (0.10/12) * 6 months
        $interestAmount = $amount * $proratedRate;
        $totalAmount = $amount + $interestAmount;

        $loan = new Loan([
            'user_id' => $user->id,
            'quarter_id' => $currentQuarter->id,
            'loan_number' => 'L' . now()->format('Y') . str_pad(Loan::count() + 1, 4, '0', STR_PAD_LEFT),
            'loan_type' => $loanType,
            'amount' => $amount,
            'total_amount' => $totalAmount,
            'outstanding_balance' => $totalAmount,
            'purpose' => $request->purpose,
            'applied_date' => now(),
            'expected_repayment_date' => $expectedRepaymentDate,
            'repayment_period_months' => $repaymentPeriodMonths,
            'status' => 'pending',
        ]);

        $loan->save();

        // Send email notification to chairperson about new loan application
        $chairperson = User::where('role', 'chairperson')->first();
        if ($chairperson) {
            $chairperson->notify(new NewLoanApplication($loan));
        }

        return redirect()->route('sacco.loans.show', $loan)
            ->with('success', 'Loan application submitted successfully!');
    }

    /**
     * Display the specified loan
     */
    public function show(Loan $loan)
    {
        $user = Auth::user();
        $isAdmin = $user->isAdmin();
        // Non-admins can only view their own loans
        if (!$isAdmin && $loan->user_id !== $user->id) {
            abort(403);
        }

        $loan->load(['user', 'approver', 'quarter', 'repaymentDeadlineQuarter', 'repayments']);

        // Calculate default repayment amount based on repayment period
        $defaultRepaymentAmount = 0;
        if ($loan->status === 'disbursed' && $loan->outstanding_balance > 0) {
            if ($loan->repayment_period_months == 1) {
                // If 1 month, default is the full remaining balance
                $defaultRepaymentAmount = $loan->outstanding_balance;
            } else {
                // Calculate months remaining until expected repayment date
                $currentDate = now();
                $expectedRepaymentDate = \Carbon\Carbon::parse($loan->getRawOriginal('expected_repayment_date'));

                // Calculate months remaining (minimum 1 to avoid division by zero)
                $monthsRemaining = max(1, $currentDate->diffInMonths($expectedRepaymentDate, false));

                // If we're past the expected date, default to full balance
                if ($monthsRemaining <= 0) {
                    $defaultRepaymentAmount = $loan->outstanding_balance;
                } else {
                    // Divide remaining balance by months remaining and round to 2 decimal places
                    $defaultRepaymentAmount = round($loan->outstanding_balance / $monthsRemaining, 2);
                }
            }
        }

        return Inertia::render('sacco/loans/Show', [
            'loan' => $loan,
            'repayments' => $loan->repayments,
            'isAdmin' => $isAdmin,
            'canManage' => $isAdmin && in_array($loan->status, ['pending', 'approved', 'disbursed']),
            'defaultRepaymentAmount' => $defaultRepaymentAmount,
        ]);
    }

    /**
     * Approve a loan (Admin/Chairperson only)
     */
    public function approve(Request $request, Loan $loan)
    {
        $user = Auth::user();

        // Check admin permissions - only chairperson can approve loans
        if (!$user->canApproveLoans()) {
            abort(403, 'Only the chairperson can approve loans.');
        }

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be approved.');
        }

        $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $loan->update([
            'status' => 'approved',
            'approved_date' => now(),
            'approved_by' => $user->id,
            'admin_notes' => $request->admin_notes,
        ]);

        // Send email notification to loan applicant
        $loan->user->notify(new LoanStatusChanged($loan, 'approved', $request->admin_notes));

        return back()->with('success', 'Loan approved successfully!');
    }

    /**
     * Reject a loan (Admin/Chairperson only)
     */
    public function reject(Request $request, Loan $loan)
    {
        $user = Auth::user();

        // Check admin permissions - only chairperson can reject loans
        if (!$user->canApproveLoans()) {
            abort(403, 'Only the chairperson can reject loans.');
        }

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be rejected.');
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $loan->update([
            'status' => 'rejected',
            'admin_notes' => $request->reason,
        ]);

        // Send email notification to loan applicant
        $loan->user->notify(new LoanStatusChanged($loan, 'rejected', $request->reason));

        return back()->with('success', 'Loan rejected.');
    }

    /**
     * Disburse a loan (Admin/Chairperson only)
     */
    public function disburse(Loan $loan)
    {
        $user = Auth::user();

        // Check admin permissions - only chairperson can disburse loans
        if (!$user->isAdmin()) {
            abort(403, 'Only the chairperson can disburse loans.');
        }

        if ($loan->status !== 'approved') {
            return back()->with('error', 'Only approved loans can be disbursed.');
        }

        $loan->update([
            'status' => 'disbursed',
            'disbursed_date' => now(),
        ]);

        // Send email notification to loan applicant
        $loan->user->notify(new LoanStatusChanged($loan, 'disbursed'));

        return back()->with('success', 'Loan disbursed successfully!');
    }

    /**
     * Record loan repayment (Admin/Chairperson only)
     */
    public function recordRepayment(Request $request, Loan $loan)
    {
        $user = Auth::user();

        // Check admin permissions - only chairperson can record repayments
        if (!$user->isAdmin()) {
            abort(403, 'Only the chairperson can record loan repayments.');
        }

        if ($loan->status !== 'disbursed') {
            return back()->with('error', 'Can only record repayments for disbursed loans.');
        }

        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $loan->outstanding_balance],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Calculate interest and principal portions
        $interestRate = $loan->getInterestRate() / 100;
        $interestAmount = $loan->amount * $interestRate;
        $totalAmount = $loan->amount + $interestAmount;

        $interestPortion = min($request->amount, $interestAmount - $loan->repayments()->sum('interest_portion'));
        $principalPortion = $request->amount - $interestPortion;

        // Create repayment record
        $loan->repayments()->create([
            'amount' => $request->amount,
            'principal_portion' => $principalPortion,
            'interest_portion' => $interestPortion,
            'payment_date' => now(),
            'payment_method' => $request->payment_method,
            'notes' => $request->notes,
        ]);

        // Update loan amounts
        $newAmountPaid = $loan->amount_paid + $request->amount;
        $newOutstandingBalance = $loan->total_amount - $newAmountPaid;

        $loan->update([
            'amount_paid' => $newAmountPaid,
            'outstanding_balance' => max(0, $newOutstandingBalance),
            'status' => $newOutstandingBalance <= 0 ? 'completed' : 'disbursed',
            'actual_repayment_date' => $newOutstandingBalance <= 0 ? now() : null,
        ]);

        return back()->with('success', 'Repayment recorded successfully!');
    }
}
