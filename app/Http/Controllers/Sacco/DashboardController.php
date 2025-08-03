<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Sacco\Loan;
use App\Models\Sacco\MemberCommitteeRole;
use App\Models\Sacco\MemberSaving;
use App\Models\Sacco\SaccoYear;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the SACCO dashboard
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);

        // Check if user is member of this organization
        if (!$user->organizations()->where('organization_id', $organizationId)->exists()) {
            return redirect()->route('organizations.index')
                ->with('error', 'You do not have access to this organization.');
        }

        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        $isAdmin = in_array($userRole, ['admin', 'owner']);

        // Get current active SACCO year
        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if (!$currentYear) {
            // Create default SACCO year if none exists
            $currentYear = SaccoYear::create([
                'organization_id' => $organizationId,
                'year' => date('Y'),
                'start_date' => date('Y') . '-01-01',
                'end_date' => date('Y') . '-12-31',
                'is_active' => true,
            ]);

            // Create quarters
            $this->createQuartersForYear($currentYear);
        }

        $currentQuarter = $currentYear->getCurrentQuarter();

        // Dashboard metrics
        $metrics = [
            'total_savings' => $user->getTotalSavings($organization),
            'available_savings' => $user->getAvailableSavings($organization),
            'total_interest_earnings' => $user->getTotalInterestEarnings($organization),
            'active_loans' => $user->loans()
                ->where('organization_id', $organizationId)
                ->where('status', 'disbursed')
                ->where('outstanding_balance', '>', 0)
                ->count(),
            'committee_role' => $user->getCommitteeRole(),
        ];

        // Admin metrics
        $adminMetrics = [];
        if ($isAdmin) {
            $adminMetrics = [
                'pending_loans' => Loan::where('organization_id', $organizationId)
                    ->where('status', 'pending')
                    ->count(),
                'total_unpaid_loans' => Loan::where('organization_id', $organizationId)
                    ->unpaid()
                    ->count(),
                'total_members' => $organization->users()->count(),
                'committee_members' => MemberCommitteeRole::where('organization_id', $organizationId)
                    ->where('is_active', true)
                    ->count(),
            ];
        }

        // Recent activity
        $recentLoans = $user->loans()
            ->where('organization_id', $organizationId)
            ->with(['approvedBy'])
            ->latest()
            ->limit(5)
            ->get();

        $recentSavings = $user->savings()
            ->where('organization_id', $organizationId)
            ->with(['saccoQuarter.saccoYear'])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Sacco/Dashboard', [
            'organization' => $organization,
            'currentYear' => $currentYear,
            'currentQuarter' => $currentQuarter,
            'userRole' => $userRole,
            'isAdmin' => $isAdmin,
            'metrics' => $metrics,
            'adminMetrics' => $adminMetrics,
            'recentLoans' => $recentLoans,
            'recentSavings' => $recentSavings,
        ]);
    }

    /**
     * Create quarters for a SACCO year
     */
    private function createQuartersForYear(SaccoYear $saccoYear): void
    {
        $year = $saccoYear->year;

        $quarters = [
            [
                'quarter_number' => 1,
                'start_date' => "{$year}-01-01",
                'end_date' => "{$year}-04-30",
            ],
            [
                'quarter_number' => 2,
                'start_date' => "{$year}-05-01",
                'end_date' => "{$year}-08-31",
            ],
            [
                'quarter_number' => 3,
                'start_date' => "{$year}-09-01",
                'end_date' => "{$year}-12-31",
            ],
        ];

        foreach ($quarters as $quarterData) {
            $saccoYear->quarters()->create($quarterData);
        }
    }
}
