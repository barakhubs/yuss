<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\Quarter;
use App\Models\MemberSavingsTarget;
use App\Models\ShareoutDecision;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SavingsController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display user's savings history and quarterly targets
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get user's savings with related data
        $savings = $user->savings()
            ->with(['quarter', 'recordedBy'])
            ->latest()
            ->paginate(15);

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        // Check if user has savings target for current quarter
        $currentTarget = null;
        $quarterSaved = 0;
        $monthsSaved = [];
        if ($currentQuarter) {
            $currentTarget = $user->savingsTargets()
                ->where('quarter_id', $currentQuarter->id)
                ->first();
            $quarterSaved = $user->getSavingsForQuarter($currentQuarter);

            // Get monthly breakdown for current quarter
            $monthsSaved = $user->savings()
                ->where('quarter_id', $currentQuarter->id)
                ->select('saved_on', 'amount', 'created_at')
                ->orderBy('saved_on')
                ->get()
                ->groupBy(function ($saving) {
                    return $saving->saved_on->format('Y-m');
                });
        }

        // Get available quarters for filter
        $quarters = Quarter::orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->get();

        // Summary stats
        $stats = [
            'total_savings' => $user->getCurrentSavingsBalance(),
            'monthly_target' => $currentTarget?->monthly_target ?? 0,
            'quarterly_target' => ($currentTarget?->monthly_target ?? 0) * 4,
            'quarter_saved' => $quarterSaved,
            'target_completion' => $currentTarget && $currentTarget->monthly_target > 0
                ? round(($quarterSaved / ($currentTarget->monthly_target * 4)) * 100, 2)
                : 0,
        ];

        return Inertia::render('sacco/member/savings/Index', [
            'savings' => $savings,
            'stats' => $stats,
            'currentQuarter' => $currentQuarter,
            'currentTarget' => $currentTarget,
            'monthsSaved' => $monthsSaved,
            'quarters' => $quarters,
            'hasSetTarget' => (bool) $currentTarget,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * Show form to set quarterly savings target or manage targets for admin
     */
    public function create()
    {
        $user = Auth::user();

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            // If user is admin, redirect to quarter management; otherwise show them the option
            if ($user->isAdmin()) {
                return redirect()->route('sacco.settings.quarters')
                    ->with('error', 'No active quarter found. Please set an active quarter to manage savings.');
            } else {
                return redirect()->route('sacco.savings.index')
                    ->with('error', 'No active quarter found. Please contact an administrator to set up the current quarter.');
            }
        }

        if ($user->isAdmin()) {
            // Admin view: Get members without targets using efficient query
            $membersWithoutTargets = User::whereDoesntHave('savingsTargets', function ($query) use ($currentQuarter) {
                $query->where('quarter_id', $currentQuarter->id);
            })
                ->where('role', '!=', 'chairperson')
                ->paginate(10, ['*'], 'members_page');

            // Get basic member count for reference
            $totalMembersCount = User::where('role', '!=', 'chairperson')->count();
            $membersWithTargetsCount = User::whereHas('savingsTargets', function ($query) use ($currentQuarter) {
                $query->where('quarter_id', $currentQuarter->id);
            })
                ->where('role', '!=', 'chairperson')
                ->count();

            // Check if we can initiate savings for this month
            $currentMonth = now()->format('Y-m');
            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            $monthSavingsExist = Saving::where('quarter_id', $currentQuarter->id)
                ->whereBetween('saved_on', [$monthStart, $monthEnd])
                ->exists();

            // Get all completed months for this quarter
            $completedMonths = Saving::where('quarter_id', $currentQuarter->id)
                ->selectRaw("TO_CHAR(saved_on, 'YYYY-MM') as month")
                ->distinct()
                ->pluck('month')
                ->toArray();

            return Inertia::render('sacco/admin/savings/Create', [
                'currentQuarter' => $currentQuarter,
                'membersWithoutTargets' => $membersWithoutTargets,
                'totalMembersCount' => $totalMembersCount,
                'membersWithTargetsCount' => $membersWithTargetsCount,
                'monthSavingsExist' => $monthSavingsExist,
                'currentMonth' => $currentMonth,
                'completedMonths' => $completedMonths,
            ]);
        } else {
            // Admin users should not set personal savings targets
            if ($user->isAdmin()) {
                return redirect()->route('sacco.savings.index')
                    ->with('error', 'Admin users cannot set personal savings targets.');
            }

            // Member view: set or view their quarterly target
            $currentTarget = $user->savingsTargets()
                ->where('quarter_id', $currentQuarter->id)
                ->first();

            // Check how much user has already saved this quarter
            $quarterSaved = $user->getSavingsForQuarter($currentQuarter);

            return Inertia::render('sacco/member/savings/SetTarget', [
                'currentQuarter' => $currentQuarter,
                'currentTarget' => $currentTarget,
                'quarterSaved' => $quarterSaved,
                'canEditTarget' => !$currentTarget, // Can only set once per quarter
            ]);
        }
    }

    /**
     * Store quarterly savings target for member
     */
    public function storeTarget(Request $request)
    {
        $user = Auth::user();

        // Admin users cannot set savings targets
        if ($user->isAdmin()) {
            return back()->with('error', 'Admin users cannot set savings targets.');
        }

        $request->validate([
            'monthly_target' => ['required', 'numeric', 'min:1', 'max:100000'],
            'quarter_id' => ['required', 'exists:quarters,id'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Verify quarter is active
        if ($quarter->status !== 'active') {
            return back()->with('error', 'Can only set targets for active quarters.');
        }

        // Check if user already has a target for this quarter
        $existingTarget = $user->savingsTargets()
            ->where('quarter_id', $quarter->id)
            ->first();

        if ($existingTarget) {
            return back()->with('error', 'You have already set your savings target for this quarter.');
        }

        // Create the savings target
        MemberSavingsTarget::create([
            'user_id' => $user->id,
            'quarter_id' => $quarter->id,
            'monthly_target' => $request->monthly_target,
        ]);

        return redirect()->route('sacco.savings.index')
            ->with('success', 'Quarterly savings target set successfully!');
    }

    /**
     * Preview monthly savings initiation (Admin/Committee only)
     */
    public function previewMonthlySavings(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'quarter_id' => ['required', 'exists:quarters,id'],
            'month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Verify quarter is active
        if ($quarter->status !== 'active') {
            return back()->with('error', 'Can only preview savings for active quarters.');
        }

        // Validate and parse the month
        try {
            $monthStart = Carbon::createFromFormat('Y-m', $request->month)->startOfMonth();
            $monthEnd = Carbon::createFromFormat('Y-m', $request->month)->endOfMonth();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid month format. Expected YYYY-MM format.',
            ], 400);
        }

        $existingSavings = Saving::where('quarter_id', $quarter->id)
            ->whereBetween('saved_on', [$monthStart, $monthEnd])
            ->exists();

        if ($existingSavings) {
            return back()->with('error', 'Savings have already been initiated for this month.');
        }

        // Get all members with targets for this quarter
        $targetsWithMembers = MemberSavingsTarget::with('user')
            ->where('quarter_id', $quarter->id)
            ->get();

        if ($targetsWithMembers->isEmpty()) {
            return back()->with('error', 'No members have set savings targets for this quarter.');
        }

        $totalAmount = $targetsWithMembers->sum('monthly_target');

        return response()->json([
            'success' => true,
            'quarter' => $quarter,
            'month' => $request->month,
            'total_amount' => $totalAmount,
            'member_count' => $targetsWithMembers->count(),
            'members' => $targetsWithMembers->map(function ($target) {
                return [
                    'id' => $target->user->id,
                    'name' => $target->user->name,
                    'email' => $target->user->email,
                    'target_amount' => $target->monthly_target,
                ];
            }),
        ]);
    }

    /**
     * Initiate monthly savings for all members (Admin only)
     */
    public function initiateMonthlySavings(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'quarter_id' => ['required', 'exists:quarters,id'],
            'month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Verify quarter is active
        if ($quarter->status !== 'active') {
            return back()->with('error', 'Can only initiate savings for active quarters.');
        }

        // Validate and parse the month
        try {
            $monthStart = Carbon::createFromFormat('Y-m', $request->month)->startOfMonth();
            $monthEnd = Carbon::createFromFormat('Y-m', $request->month)->endOfMonth();
        } catch (\Exception $e) {
            return back()->with('error', 'Invalid month format. Expected YYYY-MM format.');
        }

        $existingSavings = Saving::where('quarter_id', $quarter->id)
            ->whereBetween('saved_on', [$monthStart, $monthEnd])
            ->exists();

        if ($existingSavings) {
            return back()->with('error', 'Savings have already been initiated for this month.');
        }

        // Get all members with targets for this quarter
        $targetsWithMembers = MemberSavingsTarget::with('user')
            ->where('quarter_id', $quarter->id)
            ->get();

        if ($targetsWithMembers->isEmpty()) {
            return back()->with('error', 'No members have set savings targets for this quarter.');
        }

        $savingsCreated = 0;

        // Create savings records for each member based on their target
        foreach ($targetsWithMembers as $target) {
            Saving::create([
                'user_id' => $target->user_id,
                'quarter_id' => $quarter->id,
                'amount' => $target->monthly_target,
                'saved_on' => $monthStart, // Use the already parsed monthStart
                'notes' => 'Auto-generated based on quarterly target',
                'recorded_by' => $user->id,
            ]);
            $savingsCreated++;
        }

        return back()->with('success', "Monthly savings initiated for {$savingsCreated} members based on their quarterly targets!");
    }

    /**
     * Store monthly savings target or manual savings (deprecated - use storeTarget instead)
     */
    public function store(Request $request)
    {
        // This method is now deprecated in favor of storeTarget and initiateMonthlySavings
        return redirect()->route('sacco.savings.create')
            ->with('error', 'Please use the quarterly target system to manage savings.');
    }

    /**
     * Show share-out management page (Admin activates/manages, Members make decisions)
     */
    public function shareOut(Request $request)
    {
        $user = Auth::user();

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.savings.index')
                ->with('error', 'No active quarter found for share-out.');
        }

        if ($user->isAdmin()) {
            // Admin view: Manage share-out process
            return $this->adminShareOutView($currentQuarter);
        } else {
            // Member view: Make share-out decision
            return $this->memberShareOutView($user, $currentQuarter);
        }
    }

    /**
     * Admin view for managing share-out process
     */
    private function adminShareOutView(Quarter $quarter)
    {
        // Check if share-out is activated for this quarter
        $shareOutActivated = $quarter->shareout_activated ?? false;

        // Get all members with their savings and shareout decisions
        $members = User::with([
            'savings' => function ($query) use ($quarter) {
                $query->where('quarter_id', $quarter->id);
            },
            'shareoutDecisions' => function ($query) use ($quarter) {
                $query->where('quarter_id', $quarter->id);
            }
        ])->where('role', '!=', 'chairperson')->get();

        // Calculate summary statistics
        $totalSavings = $members->sum(function ($member) {
            return $member->savings->sum('amount');
        });

        $membersWantingShareout = $members->filter(function ($member) {
            return $member->shareoutDecisions->where('wants_shareout', true)->isNotEmpty();
        });

        $pendingDecisions = $members->filter(function ($member) {
            return $member->shareoutDecisions->isEmpty();
        });

        $completedShareouts = $members->filter(function ($member) {
            return $member->shareoutDecisions->where('shareout_completed', true)->isNotEmpty();
        });

        // Check if this is Q3 (interest share-out quarter)
        $isInterestShareOutQuarter = $quarter->quarter_number == 3;
        $totalInterestToDistribute = 0;
        $committeeInterestShare = 0;

        if ($isInterestShareOutQuarter) {
            // Calculate total interest for the year
            $yearLoans = \App\Models\Loan::whereYear('created_at', $quarter->year)
                ->where('status', 'repaid')
                ->get();

            $totalInterestToDistribute = $yearLoans->sum(function ($loan) {
                return $loan->total_amount - $loan->principal_amount;
            });

            $committeeInterestShare = $this->calculateCommitteeInterestShare($quarter->year);
        }

        return Inertia::render('sacco/admin/savings/ShareOut', [
            'quarter' => $quarter,
            'shareOutActivated' => $shareOutActivated,
            'members' => $members,
            'isInterestShareOutQuarter' => $isInterestShareOutQuarter,
            'totalInterestToDistribute' => $totalInterestToDistribute,
            'committeeInterestShare' => $committeeInterestShare,
            'statistics' => [
                'total_savings' => $totalSavings,
                'members_wanting_shareout' => $membersWantingShareout->count(),
                'pending_decisions' => $pendingDecisions->count(),
                'completed_shareouts' => $completedShareouts->count(),
                'total_members' => $members->count(),
            ],
            'membersWantingShareout' => $membersWantingShareout,
        ]);
    }

    /**
     * Member view for making share-out decision
     */
    private function memberShareOutView(User $user, Quarter $quarter)
    {
        // Check if share-out is activated
        $shareOutActivated = $quarter->shareout_activated ?? false;

        if (!$shareOutActivated) {
            return redirect()->route('sacco.savings.index')
                ->with('info', 'Share-out is not yet activated for this quarter.');
        }

        // Get member's savings for this quarter
        $quarterSavings = $user->getSavingsForQuarter($quarter);

        // Determine if this is Q3 (interest share-out quarter)
        $isInterestShareOutQuarter = $quarter->quarter_number == 3;

        $interestShareOut = 0;
        if ($isInterestShareOutQuarter) {
            // Calculate interest share-out for Q3
            $interestShareOut = $this->calculateMemberInterestShare($user, $quarter->year);
        }

        // Check if member has already made a decision
        $existingDecision = $user->shareoutDecisions()
            ->where('quarter_id', $quarter->id)
            ->first();

        return Inertia::render('sacco/member/savings/ShareOut', [
            'quarter' => $quarter,
            'quarterSavings' => $quarterSavings,
            'interestShareOut' => $interestShareOut,
            'isInterestShareOutQuarter' => $isInterestShareOutQuarter,
            'existingDecision' => $existingDecision,
            'canMakeDecision' => !$existingDecision || !$existingDecision->shareout_completed,
        ]);
    }

    /**
     * Calculate member's interest share for Q3 share-out
     */
    private function calculateMemberInterestShare(User $user, int $year)
    {
        // Get all loans for the year with their interest
        $yearLoans = \App\Models\Loan::with('user')
            ->whereYear('created_at', $year)
            ->where('status', 'repaid')
            ->get();

        if ($yearLoans->isEmpty()) {
            return 0;
        }

        $totalInterest = 0;
        $memberLoanInterest = 0; // Interest from loans this member took

        foreach ($yearLoans as $loan) {
            $loanInterest = $loan->total_amount - $loan->principal_amount;
            $totalInterest += $loanInterest;

            // If this member took the loan, they get 50% of their loan's interest
            if ($loan->user_id === $user->id) {
                $memberLoanInterest += $loanInterest * 0.5;
            }
        }

        // 25% of all interest goes to regular members (including loan bearers)
        $regularMemberShare = $totalInterest * 0.25;

        // Count regular members for distribution (non-chairperson roles)
        $regularMemberCount = User::where('role', '!=', 'chairperson')
            ->where('role', '!=', 'secretary')
            ->where('role', '!=', 'treasurer')
            ->where('role', '!=', 'disburser')
            ->count();

        $memberGeneralShare = $regularMemberCount > 0 ? $regularMemberShare / $regularMemberCount : 0;

        // Total interest share = loan bearer share (50%) + general member share (25% distributed)
        return $memberLoanInterest + $memberGeneralShare;
    }

    /**
     * Calculate admin/committee interest share for Q3 share-out
     * Note: This preserves existing business logic for interest distribution
     */
    private function calculateCommitteeInterestShare(int $year)
    {
        // Get all loans for the year with their interest
        $yearLoans = \App\Models\Loan::whereYear('created_at', $year)
            ->where('status', 'repaid')
            ->get();

        if ($yearLoans->isEmpty()) {
            return 0;
        }

        $totalInterest = 0;
        foreach ($yearLoans as $loan) {
            $totalInterest += $loan->total_amount - $loan->principal_amount;
        }

        // 25% of all interest goes to admin/committee members
        $adminShare = $totalInterest * 0.25;

        // Count admin/committee members for distribution
        $adminCount = User::whereIn('role', ['chairperson', 'secretary', 'treasurer', 'disburser'])
            ->count();

        return $adminCount > 0 ? $adminShare / $adminCount : 0;
    }

    /**
     * Activate share-out for the quarter (Admin only)
     */
    public function activateShareOut(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'quarter_id' => ['required', 'exists:quarters,id'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Verify quarter is active
        if ($quarter->status !== 'active') {
            return back()->with('error', 'Can only activate share-out for active quarters.');
        }

        // Activate share-out for the quarter
        $quarter->update(['shareout_activated' => true]);

        return back()->with('success', 'Share-out has been activated for this quarter! Members can now make their decisions.');
    }

    /**
     * Member makes share-out decision
     */
    public function makeShareOutDecision(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'quarter_id' => ['required', 'exists:quarters,id'],
            'wants_shareout' => ['required', 'boolean'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Check if share-out is activated
        if (!$quarter->shareout_activated) {
            return back()->with('error', 'Share-out is not yet activated for this quarter.');
        }

        // Check if member already has a decision
        $existingDecision = $user->shareoutDecisions()
            ->where('quarter_id', $quarter->id)
            ->first();

        if ($existingDecision && $existingDecision->shareout_completed) {
            return back()->with('error', 'Your share-out has already been completed.');
        }

        $quarterSavings = $user->getSavingsForQuarter($quarter);

        // Interest is only calculated for Q3 share-outs
        $interestAmount = 0;
        if ($quarter->quarter_number == 3) {
            $interestAmount = $this->calculateMemberInterestShare($user, $quarter->year);
        }

        if ($existingDecision) {
            // Update existing decision
            $existingDecision->update([
                'wants_shareout' => $request->wants_shareout,
                'savings_balance' => $quarterSavings,
                'interest_amount' => $interestAmount,
                'decision_made_at' => now(),
            ]);
        } else {
            // Create new decision
            ShareoutDecision::create([
                'user_id' => $user->id,
                'quarter_id' => $quarter->id,
                'wants_shareout' => $request->wants_shareout,
                'savings_balance' => $quarterSavings,
                'interest_amount' => $interestAmount,
                'decision_made_at' => now(),
            ]);
        }

        $isQ3 = $quarter->quarter_number == 3;
        $message = $request->wants_shareout
            ? ($isQ3
                ? 'You have chosen to share out your savings and interest. The admin will process this soon.'
                : 'You have chosen to share out your savings. The admin will process this soon.')
            : ($isQ3
                ? 'You have chosen to keep your savings and interest for the next quarter.'
                : 'You have chosen to keep your savings for the next quarter.');

        return back()->with('success', $message);
    }

    /**
     * Complete share-out for a member (Admin only)
     */
    public function completeShareOut(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'decision_id' => ['required', 'exists:shareout_decisions,id'],
        ]);

        $decision = ShareoutDecision::with(['user', 'quarter'])->findOrFail($request->decision_id);

        if ($decision->shareout_completed) {
            return back()->with('error', 'This share-out has already been completed.');
        }

        if (!$decision->wants_shareout) {
            return back()->with('error', 'This member chose not to share out.');
        }

        // Reset member's savings balance to 0 for this quarter
        $decision->user->savings()
            ->where('quarter_id', $decision->quarter_id)
            ->update(['shared_out' => true, 'shared_out_at' => now()]);

        // Mark share-out as completed
        $decision->update([
            'shareout_completed' => true,
            'shareout_completed_at' => now(),
            'completed_by' => $user->id,
        ]);

        return back()->with('success', "Share-out completed for {$decision->user->name}. Their savings balance has been reset.");
    }

    /**
     * Bulk complete share-outs for multiple members (Admin only)
     */
    public function bulkCompleteShareOut(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'decision_ids' => ['required', 'array'],
            'decision_ids.*' => ['exists:shareout_decisions,id'],
        ]);

        $decisions = ShareoutDecision::with(['user', 'quarter'])
            ->whereIn('id', $request->decision_ids)
            ->where('wants_shareout', true)
            ->where('shareout_completed', false)
            ->get();

        $completedCount = 0;

        foreach ($decisions as $decision) {
            // Reset member's savings balance to 0 for this quarter
            $decision->user->savings()
                ->where('quarter_id', $decision->quarter_id)
                ->update(['shared_out' => true, 'shared_out_at' => now()]);

            // Mark share-out as completed
            $decision->update([
                'shareout_completed' => true,
                'shareout_completed_at' => now(),
                'completed_by' => $user->id,
            ]);

            $completedCount++;
        }

        return back()->with('success', "Completed share-out for {$completedCount} members. Their savings balances have been reset.");
    }

    /**
     * Show savings summary for admins
     */
    public function summary(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403);
        }

        // Get all quarters with savings data and targets
        $quarters = Quarter::with(['savings.user', 'memberSavingsTargets.user'])
            ->orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->get();

        // Calculate overall statistics
        $allSavings = collect();
        $allUsers = collect();
        $quarterStats = [];

        foreach ($quarters as $quarter) {
            $quarterSavings = $quarter->savings->sum('amount');
            $quarterUsers = $quarter->savings->pluck('user_id')->unique();

            $allSavings = $allSavings->merge($quarter->savings);
            $allUsers = $allUsers->merge($quarterUsers);

            if ($quarterSavings > 0) {
                $quarterStats[] = [
                    'quarter' => $quarter->quarter_number,
                    'year' => $quarter->year,
                    'amount' => $quarterSavings,
                ];
            }
        }

        // Calculate year summaries
        $yearSummaries = $quarters->groupBy('year')->map(function ($yearQuarters, $year) {
            $totalSavings = $yearQuarters->sum(function ($quarter) {
                return $quarter->savings->sum('amount');
            });

            $allMembers = $yearQuarters->flatMap(function ($quarter) {
                return $quarter->savings->pluck('user_id')->unique();
            })->unique();

            $memberCount = $allMembers->count();

            $members = $allMembers->map(function ($userId) use ($yearQuarters) {
                $user = User::find($userId);
                $userSavings = $yearQuarters->flatMap(function ($quarter) use ($userId) {
                    return $quarter->savings->where('user_id', $userId);
                });

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'total_amount' => $userSavings->sum('amount'),
                    'contributions_count' => $userSavings->count(),
                ];
            })->sortByDesc('total_amount')->values();

            return [
                'year' => $year,
                'total_savings' => $totalSavings,
                'member_count' => $memberCount,
                'average_per_member' => $memberCount > 0 ? round($totalSavings / $memberCount, 2) : 0,
                'members' => $members,
            ];
        })->sortByDesc('year')->values();

        // Calculate overall stats
        $totalAllTime = $allSavings->sum('amount');
        $totalActiveMembers = $allUsers->unique()->count();
        $averagePerMemberAllTime = $totalActiveMembers > 0 ? round($totalAllTime / $totalActiveMembers, 2) : 0;

        // Find highest quarter
        $highestQuarter = collect($quarterStats)->sortByDesc('amount')->first();

        // Find most active member
        $userSavingsTotals = $allSavings->groupBy('user_id')->map(function ($userSavings, $userId) {
            $user = User::find($userId);
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'total_savings' => $userSavings->sum('amount'),
                'quarters_participated' => $userSavings->pluck('quarter_id')->unique()->count(),
            ];
        })->sortByDesc('total_savings');

        $mostActiveMember = $userSavingsTotals->first();

        $overallStats = [
            'total_all_time' => $totalAllTime,
            'total_active_members' => $totalActiveMembers,
            'average_per_member_all_time' => $averagePerMemberAllTime,
            'highest_quarter_savings' => $highestQuarter ?: [
                'quarter' => 0,
                'year' => date('Y'),
                'amount' => 0,
            ],
            'most_active_member' => $mostActiveMember ?: [
                'user' => [
                    'id' => 0,
                    'name' => 'No members yet',
                    'email' => '',
                ],
                'total_savings' => 0,
                'quarters_participated' => 0,
            ],
        ];

        return Inertia::render('sacco/admin/savings/Summary', [
            'yearSummaries' => $yearSummaries,
            'overallStats' => $overallStats,
        ]);
    }
}
