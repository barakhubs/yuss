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
        $isCommitteeMember = $user->isCommitteeMember();

        // Build query
        $query = Loan::with(['user', 'approver', 'quarter']);

        // If not admin or committee member, only show user's own loans
        if (!$isAdmin && !$isCommitteeMember) {
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

        $loans = $query->latest()->paginate(15);

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

        return Inertia::render('Sacco/Loans/Index', [
            'loans' => $loans,
            'isAdmin' => $isAdmin,
            'isCommitteeMember' => $isCommitteeMember,
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

        // Check if user can apply for loan
        if ($user->hasActiveLoan()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You cannot apply for a loan at this time. You have an existing active loan.');
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

        // Use a more precise calculation - count months from start of current month to end month
        $currentMonth = $currentDate->copy()->startOfMonth();
        $endMonth = $quarterEndDate->copy()->startOfMonth();
        $monthsRemainingInQuarter = $currentMonth->diffInMonths($endMonth) + 1;

        // Ensure we don't go negative
        if ($monthsRemainingInQuarter <= 0) {
            $monthsRemainingInQuarter = 0;
        }

        // Maximum repayment period is the lesser of 4 months or months remaining in quarter
        $maxRepaymentMonths = min(4, $monthsRemainingInQuarter);

        // Generate available repayment periods (1 to max months)
        // Apply 22nd day rule: loans taken before the 22nd of a month can be repaid within that same month
        $availableRepaymentPeriods = [];
        for ($i = 1; $i <= $maxRepaymentMonths; $i++) {
            // Use the same calculation method as loan creation
            $repaymentDate = Loan::calculateRepaymentDate($currentDate, $i);

            $availableRepaymentPeriods[] = [
                'months' => $i,
                'label' => $i . ' month' . ($i > 1 ? 's' : ''),
                'repayment_date' => $repaymentDate->format('Y-m-d'),
                'repayment_month' => $repaymentDate->format('F Y'),
            ];
        }

        // If no repayment periods available, user can't apply
        if (empty($availableRepaymentPeriods)) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'No available repayment periods in the current quarter. Please wait for the next quarter.');
        }

        return Inertia::render('Sacco/Member/Loans/Create', [
            'currentQuarter' => $currentQuarter,
            'availableRepaymentPeriods' => $availableRepaymentPeriods,
            'maxRepaymentMonths' => $maxRepaymentMonths,
            'quarterEndDate' => $quarterEndDate->format('F j, Y'),
            'userSavingsBalance' => $user->getCurrentSavingsBalance(),
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

        // Check if user can apply for loan (same check as in create method)
        if ($user->hasActiveLoan()) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You cannot apply for a loan at this time. You have an existing active loan.');
        }

        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'purpose' => ['required', 'string', 'max:500'],
            'repayment_period_months' => ['required', 'integer', 'min:1', 'max:4'],
        ]);

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active quarter found for loan applications.');
        }

        // Calculate quarter constraints (same logic as in create method)
        $quarterEndDateString = (string) $currentQuarter->end_date;
        $quarterEndDate = \Carbon\Carbon::parse($quarterEndDateString);
        $currentDate = now();
        $currentMonth = $currentDate->copy()->startOfMonth();
        $endMonth = $quarterEndDate->copy()->startOfMonth();
        $monthsRemainingInQuarter = $currentMonth->diffInMonths($endMonth) + 1;
        $maxRepaymentMonths = min(4, max(0, $monthsRemainingInQuarter));

        // Validate the requested repayment period
        if ($request->repayment_period_months > $maxRepaymentMonths) {
            return redirect()->back()
                ->withInput()
                ->with('error', "Repayment period cannot exceed {$maxRepaymentMonths} months based on the current quarter timing.");
        }

        // Calculate expected repayment date with 22nd day rule
        $repaymentPeriodMonths = (int) $request->repayment_period_months;
        $expectedRepaymentDate = Loan::calculateRepaymentDate($currentDate, $repaymentPeriodMonths);

        // Pre-calculate total amount with interest
        $amount = (float) $request->amount;
        $interestAmount = $amount * 0.05; // 5% interest rate
        $totalAmount = $amount + $interestAmount;

        $loan = new Loan([
            'user_id' => $user->id,
            'quarter_id' => $currentQuarter->id,
            'loan_number' => 'L' . now()->format('Y') . str_pad(Loan::count() + 1, 4, '0', STR_PAD_LEFT),
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
        $isCommitteeMember = $user->isCommitteeMember();

        // Non-admins and non-committee members can only view their own loans
        if (!$isAdmin && !$isCommitteeMember && $loan->user_id !== $user->id) {
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

        return Inertia::render('Sacco/Loans/Show', [
            'loan' => $loan,
            'repayments' => $loan->repayments,
            'isAdmin' => $isAdmin,
            'isCommitteeMember' => $isCommitteeMember,
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
