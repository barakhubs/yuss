<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Quarter;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\MemberSavingsTarget;
use App\Notifications\UserCredentials;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
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
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can view member list.');
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

        $members = $query->paginate(10);

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
                'current_quarter_target' => $currentQuarterTarget ? $currentQuarterTarget->monthly_target * 4 : null, // Convert monthly to quarterly
                'has_active_loan' => $hasActiveLoan,
                'total_loans_amount' => $totalLoansAmount,
                'active_loan_balance' => $activeLoanBalance,
                'role_display' => ucfirst(str_replace('_', ' ', $member->role)),
                'status_display' => $member->is_verified ? 'Active' : 'Inactive',
                'joined_date' => $member->created_at->format('M d, Y'),
                'last_login' => $member->last_login_at ? $member->last_login_at->format('M d, Y') : 'Never',
                'can_be_impersonated' => $member->canBeImpersonated(),
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
            'committee_members' => User::where('role', 'chairperson')->count(),
            'pending_invitations' => User::where('is_verified', false)->whereNotNull('invitation_token')->count(),
        ];

        return Inertia::render('sacco/admin/members/Index', [
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
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can view member details.');
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

        return Inertia::render('sacco/admin/members/Show', [
            'member' => $member,
            'savingsByQuarter' => $savingsByQuarter,
            'loanSummary' => $loanSummary,
        ]);
    }

    /**
     * Show the form for creating a new user (Admin only)
     */
    public function create()
    {
        // Only chairperson can create users directly
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can create users directly.');
        }

        return Inertia::render('sacco/admin/members/Create');
    }

    /**
     * Store a new user created by admin
     */
    public function store(Request $request)
    {
        // Only chairperson can create users directly
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can create users directly.');
        }

        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:chairperson,secretary,treasurer,disburser,member'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'send_credentials' => ['boolean'],
        ]);

        // Create user directly without invitation
        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
            'is_verified' => true,
            'created_by_admin' => true,
            'email_verified_at' => now(),
        ]);

        // Optionally send credentials email
        if ($request->send_credentials) {
            $user->notify(new UserCredentials($request->password));
        }

        return redirect()->route('sacco.members.index')
            ->with('success', "User {$user->name} created successfully!" .
                ($request->send_credentials ? ' Credentials have been sent via email.' : ''));
    }

    /**
     * Start impersonating a user (Admin only)
     */
    public function impersonate(User $user)
    {
        $currentUser = Auth::user();

        // Only chairperson can impersonate
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only administrators can impersonate users.');
        }

        // Cannot impersonate yourself
        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot impersonate yourself.');
        }

        // Check if user can be impersonated
        if (!$user->canBeImpersonated()) {
            return back()->with('error', 'You can only impersonate verified members (not administrators).');
        }

        // Store the original user ID in session
        session(['impersonator_id' => $currentUser->id]);

        // Login as the target user
        Auth::login($user);

        return redirect()->route('sacco.dashboard')
            ->with('success', "You are now impersonating {$user->name}. Use the 'Stop Impersonating' button when done.");
    }

    /**
     * Stop impersonating and return to original user
     */
    public function stopImpersonating()
    {
        $impersonatorId = session('impersonator_id');

        if (!$impersonatorId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'You are not currently impersonating anyone.');
        }

        $originalUser = User::find($impersonatorId);

        if (!$originalUser) {
            session()->forget('impersonator_id');
            return redirect()->route('login')
                ->with('error', 'Original user not found. Please login again.');
        }

        // Clear impersonation session
        session()->forget('impersonator_id');

        // Login as original user
        Auth::login($originalUser);

        return redirect()->route('sacco.members.index')
            ->with('success', 'Stopped impersonating. You are back to your original account.');
    }

    /**
     * Delete a user (Super Admin only)
     */
    public function destroy(User $user)
    {
        $currentUser = Auth::user();

        Log::info("User $user->name is being deleted by $currentUser.");
        // Only super admin can delete users
        if (!$currentUser->isSuperAdmin()) {
            abort(403, 'Only super administrators can delete users.');
        }

        // Cannot delete yourself
        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot delete yourself.');
        }

        // Cannot delete users with active loans
        if ($user->loans()->whereIn('status', ['approved', 'disbursed'])->exists()) {
            return back()->with('error', 'Cannot delete user with active loans. Please complete or cancel their loans first.');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->route('sacco.members.index')
            ->with('success', "User {$userName} has been deleted successfully.");
    }

    /**
     * Activate an invited member (Admin only)
     */
    public function activate(User $user)
    {
        $currentUser = Auth::user();

        // Only admins can activate users
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only administrators can activate users.');
        }

        // Check if user is actually inactive/invited
        if ($user->is_verified) {
            return back()->with('error', 'User is already activated.');
        }

        // Activate the user
        $user->update([
            'is_verified' => true,
            'email_verified_at' => now(),
            'invitation_token' => null, // Clear the invitation token
        ]);

        return redirect()->route('sacco.members.index')
            ->with('success', "User {$user->name} has been activated successfully.");
    }

    /**
     * Deactivate a member (Admin only)
     */
    public function deactivate(User $user)
    {
        $currentUser = Auth::user();

        // Only admins can deactivate users
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only administrators can deactivate users.');
        }

        // Cannot deactivate yourself
        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot deactivate yourself.');
        }

        // Check if user is already inactive
        if (!$user->is_verified) {
            return back()->with('error', 'User is already deactivated.');
        }

        // Cannot deactivate users with active loans
        if ($user->loans()->whereIn('status', ['approved', 'disbursed'])->exists()) {
            return back()->with('error', 'Cannot deactivate user with active loans. Please ensure their loans are completed or cancelled first.');
        }

        // Deactivate the user
        $user->update([
            'is_verified' => false,
        ]);

        return redirect()->route('sacco.members.index')
            ->with('success', "User {$user->name} has been deactivated successfully.");
    }

    /**
     * Update member category (Admin only)
     */
    public function updateCategory(Request $request, User $member)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can update member categories.');
        }

        $request->validate([
            'savings_category' => ['required', 'in:A,B,C'],
        ]);

        $oldCategory = $member->savings_category;
        $newCategory = $request->savings_category;

        $member->update([
            'savings_category' => $newCategory,
        ]);

        $message = $oldCategory
            ? "Member category updated from {$oldCategory} to {$newCategory} successfully."
            : "Member category set to {$newCategory} successfully.";

        return back()->with('success', $message);
    }
}
