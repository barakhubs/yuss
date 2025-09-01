<?php

namespace App\Http\Controllers\sacco;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Quarter;
use App\Models\Loan;
use App\Models\Saving;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the sacco dashboard
     */
    public function index()
    {
        $user = Auth::user();

        // Check if user is admin or committee member
        $isAdmin = $user->isAdmin();
        $isCommitteeMember = $user->isCommitteeMember();

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            // If no active quarter, get the latest one
            $currentQuarter = Quarter::orderBy('year', 'desc')
                ->orderBy('quarter_number', 'desc')
                ->first();
        }

        // Dashboard metrics for regular users
        $metrics = [
            'current_savings_balance' => $user->getCurrentSavingsBalance(),
            'active_loans' => $user->hasActiveLoan() ? 1 : 0,
            'quarter_target' => ($user->getCurrentQuarterTarget()?->monthly_target ?? 0) * 4, // Convert monthly to quarterly
            'quarter_saved' => $currentQuarter ? $user->getSavingsForQuarter($currentQuarter) : 0,
            'role' => $user->role,
        ];

        // Admin metrics
        $adminMetrics = [];
        if ($isAdmin || $isCommitteeMember) {
            $adminMetrics = [
                'pending_loans' => Loan::where('status', 'pending')->count(),
                'total_members' => User::where('is_verified', true)->count(),
                'pending_invitations' => User::where('is_verified', false)->whereNotNull('invitation_token')->count(),
                'committee_members' => User::whereIn('role', ['chairperson', 'secretary', 'treasurer', 'disburser'])->count(),
                'total_savings_this_quarter' => $currentQuarter ?
                    Saving::where('quarter_id', $currentQuarter->id)->sum('amount') : 0,
                'total_outstanding_loans' => Loan::whereIn('status', ['approved', 'disbursed'])
                    ->sum('outstanding_balance'),
            ];
        }

        return Inertia::render('sacco/Dashboard', [
            'currentQuarter' => $currentQuarter,
            'metrics' => $metrics,
            'adminMetrics' => $adminMetrics,
            'isAdmin' => $isAdmin,
            'isCommitteeMember' => $isCommitteeMember,
            'userRole' => $user->role,
            'recentLoans' => [],
            'recentSavings' => [],
        ]);
    }
}
