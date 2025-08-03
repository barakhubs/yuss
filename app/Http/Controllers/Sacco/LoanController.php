<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Sacco\Loan;
use App\Models\Sacco\SaccoYear;
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
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        $isAdmin = in_array($userRole, ['admin', 'owner']);

        // Build query
        $query = Loan::where('organization_id', $organizationId)
            ->with(['user', 'approvedBy', 'saccoYear']);

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
                $q->where('loan_number', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $loans = $query->latest()->paginate(15);

        return Inertia::render('Sacco/Loans/Index', [
            'organization' => $organization,
            'loans' => $loans,
            'isAdmin' => $isAdmin,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
            'statuses' => Loan::STATUSES,
        ]);
    }

    /**
     * Show the form for creating a new loan
     */
    public function create()
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);

        // Check if user can apply for loan
        if (!$user->canApplyForLoan($organization)) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You cannot apply for a loan at this time. You may have an existing unpaid loan.');
        }

        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if (!$currentYear) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active SACCO year found. Please contact an administrator.');
        }

        return Inertia::render('Sacco/Loans/Create', [
            'organization' => $organization,
            'currentYear' => $currentYear,
            'userSavings' => $user->getAvailableSavings($organization),
        ]);
    }

    /**
     * Store a newly created loan
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);

        // Check if user can apply for loan
        if (!$user->canApplyForLoan($organization)) {
            return redirect()->route('sacco.loans.index')
                ->with('error', 'You cannot apply for a loan at this time.');
        }

        $request->validate([
            'principal_amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'purpose' => ['required', 'string', 'max:500'],
            'expected_repayment_date' => ['required', 'date', 'after:today'],
        ]);

        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if (!$currentYear) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active SACCO year found.');
        }

        $loan = new Loan([
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'sacco_year_id' => $currentYear->id,
            'loan_number' => Loan::generateLoanNumber(),
            'principal_amount' => $request->principal_amount,
            'interest_rate' => 5.00, // Fixed 5% rate
            'purpose' => $request->purpose,
            'applied_date' => now(),
            'expected_repayment_date' => $request->expected_repayment_date,
            'status' => 'pending',
        ]);

        $loan->calculateTotalAmount();
        $loan->save();

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
