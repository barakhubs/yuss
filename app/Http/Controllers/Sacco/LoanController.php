<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Quarter;
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

        // Get available quarters for repayment deadline (max 3 quarters ahead)
        $availableQuarters = Quarter::where('year', '>=', $currentQuarter->year)
            ->where(function ($query) use ($currentQuarter) {
                $query->where('year', '>', $currentQuarter->year)
                    ->orWhere(function ($q) use ($currentQuarter) {
                        $q->where('year', $currentQuarter->year)
                            ->where('quarter_number', '>', $currentQuarter->quarter_number);
                    });
            })
            ->orderBy('year')
            ->orderBy('quarter_number')
            ->limit(3)
            ->get();

        return Inertia::render('Sacco/Loans/Create', [
            'currentQuarter' => $currentQuarter,
            'availableQuarters' => $availableQuarters,
            'userSavingsBalance' => $user->getCurrentSavingsBalance(),
        ]);
    }

    /**
     * Store a newly created loan
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'principal_amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'purpose' => ['required', 'string', 'max:500'],
            'expected_repayment_date' => ['required', 'date', 'after:today'],
        ]);

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active quarter found for loan applications.');
        }

        $loan = new Loan([
            'user_id' => $user->id,
            'quarter_id' => $currentQuarter->id,
            'loan_number' => 'L' . now()->format('Y') . str_pad(Loan::count() + 1, 4, '0', STR_PAD_LEFT),
            'principal_amount' => $request->principal_amount,
            'interest_rate' => 5.00, // Fixed 5% rate
            'purpose' => $request->purpose,
            'applied_date' => now(),
            'expected_repayment_date' => $request->expected_repayment_date,
            'status' => 'pending',
        ]);

        $loan->save();

        // Calculate total amount with interest after save
        $totalAmount = $loan->principal_amount + ($loan->principal_amount * $loan->interest_rate / 100);
        $loan->update(['total_amount' => $totalAmount]);

        return redirect()->route('sacco.loans.show', $loan)
            ->with('success', 'Loan application submitted successfully!');
    }

    /**
     * Display the specified loan
     */
    public function show(Loan $loan)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        // Ensure loan belongs to current organization
        if ($loan->organization_id !== $organizationId) {
            abort(404);
        }

        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        $isAdmin = in_array($userRole, ['admin', 'owner']);

        // Non-admins can only view their own loans
        if (!$isAdmin && $loan->user_id !== $user->id) {
            abort(403);
        }

        $loan->load(['user', 'approvedBy', 'saccoYear', 'repayments', 'interestDistributions']);

        return Inertia::render('Sacco/Loans/Show', [
            'loan' => $loan,
            'repayments' => $loan->repayments,
            'isAdmin' => $isAdmin,
            'canManage' => $isAdmin && in_array($loan->status, ['pending', 'approved', 'disbursed']),
        ]);
    }

    /**
     * Approve a loan (Admin only)
     */
    public function approve(Request $request, Loan $loan)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        // Check admin permissions
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        if (!in_array($userRole, ['admin', 'owner'])) {
            abort(403);
        }

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be approved.');
        }

        $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $loan->approve($user);

        if ($request->admin_notes) {
            $loan->update(['admin_notes' => $request->admin_notes]);
        }

        return back()->with('success', 'Loan approved successfully!');
    }

    /**
     * Reject a loan (Admin only)
     */
    public function reject(Request $request, Loan $loan)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        // Check admin permissions
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        if (!in_array($userRole, ['admin', 'owner'])) {
            abort(403);
        }

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be rejected.');
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $loan->reject($request->reason);

        return back()->with('success', 'Loan rejected.');
    }

    /**
     * Disburse a loan (Admin only)
     */
    public function disburse(Loan $loan)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        // Check admin permissions
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        if (!in_array($userRole, ['admin', 'owner'])) {
            abort(403);
        }

        if ($loan->status !== 'approved') {
            return back()->with('error', 'Only approved loans can be disbursed.');
        }

        $loan->disburse();

        return back()->with('success', 'Loan disbursed successfully!');
    }

    /**
     * Record loan repayment (Admin only)
     */
    public function recordRepayment(Request $request, Loan $loan)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        // Check admin permissions
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        if (!in_array($userRole, ['admin', 'owner'])) {
            abort(403);
        }

        if ($loan->status !== 'disbursed') {
            return back()->with('error', 'Can only record repayments for disbursed loans.');
        }

        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $loan->outstanding_balance],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $loan->recordRepayment(
            $request->amount,
            $request->payment_method,
            $request->notes
        );

        return back()->with('success', 'Repayment recorded successfully!');
    }
}
