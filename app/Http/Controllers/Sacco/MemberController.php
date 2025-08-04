<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Quarter;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\MemberSavingsTarget;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MemberController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a list of all members (Admin only)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin() && !$user->isCommitteeMember()) {
            abort(403, 'Only admins and committee members can view member list.');
        }

        $search = $request->get('search');
        $status = $request->get('status', 'all'); // all, active, inactive
        $role = $request->get('role', 'all'); // all, member, secretary, treasurer, disburser

        // Build query for members
        $query = User::with(['savingsTargets.quarter', 'savings', 'loans'])
            ->withCount(['savings', 'loans']);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status !== 'all') {
            if ($status === 'active') {
                $query->where('is_verified', true);
            } elseif ($status === 'inactive') {
                $query->where('is_verified', false);
            }
        }

        // Apply role filter
        if ($role !== 'all') {
            $query->where('role', $role);
        }

        // Order by name
        $query->orderBy('name');

        $members = $query->paginate(20);

        // Get current quarter for additional context
        $currentQuarter = Quarter::where('status', 'active')->first();

        // Transform members data to include additional calculated fields
        $members->getCollection()->transform(function ($member) use ($currentQuarter) {
            // Calculate total savings
            $totalSavings = $member->savings->sum('amount');

            // Calculate current quarter savings
            $currentQuarterSavings = 0;
            if ($currentQuarter) {
                $currentQuarterSavings = $member->savings
                    ->where('quarter_id', $currentQuarter->id)
                    ->sum('amount');
            }

            // Get current quarter target
            $currentQuarterTarget = null;
            if ($currentQuarter) {
                $currentQuarterTarget = $member->savingsTargets
                    ->where('quarter_id', $currentQuarter->id)
                    ->first();
            }

            // Check for active loans
            $hasActiveLoan = $member->loans->where('status', 'disbursed')->where('outstanding_balance', '>', 0)->isNotEmpty();

            // Calculate loan statistics
            $totalLoansAmount = $member->loans->sum('amount');
            $activeLoanBalance = $member->loans->where('status', 'disbursed')->sum('outstanding_balance');

            return array_merge($member->toArray(), [
                'total_savings' => $totalSavings,
                'current_quarter_savings' => $currentQuarterSavings,
                'current_quarter_target' => $currentQuarterTarget ? $currentQuarterTarget->monthly_target * 3 : null, // Convert monthly to quarterly
                'has_active_loan' => $hasActiveLoan,
                'total_loans_amount' => $totalLoansAmount,
                'active_loan_balance' => $activeLoanBalance,
                'role_display' => ucfirst(str_replace('_', ' ', $member->role)),
                'status_display' => $member->is_verified ? 'Active' : 'Inactive',
                'joined_date' => $member->created_at->format('M d, Y'),
                'last_login' => $member->last_login_at ? $member->last_login_at->format('M d, Y') : 'Never',
            ]);
        });

        // Calculate summary statistics
        $totalMembers = User::where('is_verified', true)->count();
        $totalSavings = Saving::sum('amount');
        $totalActiveLoans = Loan::where('status', 'disbursed')->where('outstanding_balance', '>', 0)->count();
        $totalLoanBalance = Loan::where('status', 'disbursed')->sum('outstanding_balance');

        $statistics = [
            'total_members' => $totalMembers,
            'total_savings' => $totalSavings,
            'total_active_loans' => $totalActiveLoans,
            'total_loan_balance' => $totalLoanBalance,
            'committee_members' => User::whereIn('role', ['chairperson', 'secretary', 'treasurer', 'disburser'])->count(),
            'pending_invitations' => User::where('is_verified', false)->whereNotNull('invitation_token')->count(),
        ];

        return Inertia::render('Sacco/Admin/Members/Index', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'role' => $role,
            ],
            'statistics' => $statistics,
            'currentQuarter' => $currentQuarter,
        ]);
    }

    /**
     * Show member details (Admin only)
     */
    public function show(User $member)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin() && !$user->isCommitteeMember()) {
            abort(403, 'Only admins and committee members can view member details.');
        }

        // Load member relationships
        $member->load([
            'savingsTargets.quarter',
            'savings.quarter',
            'loans' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'shareoutDecisions.quarter'
        ]);

        // Get savings summary by quarter
        $savingsByQuarter = $member->savings->groupBy('quarter_id')->map(function ($quarterSavings) {
            $quarter = $quarterSavings->first()->quarter;
            return [
                'quarter' => $quarter,
                'total_amount' => $quarterSavings->sum('amount'),
                'months_count' => $quarterSavings->count(),
                'average_monthly' => $quarterSavings->avg('amount'),
            ];
        })->values();

        // Get loan summary
        $loanSummary = [
            'total_loans' => $member->loans->count(),
            'total_amount_borrowed' => $member->loans->sum('amount'),
            'total_amount_repaid' => $member->loans->sum(function ($loan) {
                return $loan->amount_paid;
            }),
            'current_balance' => $member->loans->where('status', 'disbursed')->sum('outstanding_balance'),
            'completed_loans' => $member->loans->where('status', 'completed')->count(),
            'active_loans' => $member->loans->where('status', 'disbursed')->where('outstanding_balance', '>', 0)->count(),
        ];

        return Inertia::render('Sacco/Admin/Members/Show', [
            'member' => $member,
            'savingsByQuarter' => $savingsByQuarter,
            'loanSummary' => $loanSummary,
        ]);
    }
}
