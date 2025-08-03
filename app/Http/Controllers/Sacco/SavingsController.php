<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Sacco\MemberSaving;
use App\Models\Sacco\SaccoQuarter;
use App\Models\Sacco\SaccoYear;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SavingsController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display user's savings history
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

        // Get user's savings with related data
        $savings = $user->savings()
            ->where('organization_id', $organizationId)
            ->with(['saccoQuarter.saccoYear'])
            ->latest()
            ->paginate(15);

        // Get current active quarter
        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        $currentQuarter = $currentYear?->getCurrentQuarter();

        // Check if user has already saved for current quarter
        $hasSavedThisQuarter = false;
        if ($currentQuarter) {
            $hasSavedThisQuarter = MemberSaving::where('user_id', $user->id)
                ->where('sacco_quarter_id', $currentQuarter->id)
                ->exists();
        }

        // Summary stats
        $stats = [
            'total_savings' => $user->getTotalSavings($organization),
            'available_savings' => $user->getAvailableSavings($organization),
            'shared_out_total' => $user->savings()
                ->where('organization_id', $organizationId)
                ->where('shared_out', true)
                ->sum('amount'),
        ];

        return Inertia::render('Sacco/Savings/Index', [
            'organization' => $organization,
            'savings' => $savings,
            'stats' => $stats,
            'currentQuarter' => $currentQuarter,
            'hasSavedThisQuarter' => $hasSavedThisQuarter,
        ]);
    }

    /**
     * Show form to input monthly savings
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

        // Get current active quarter
        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if (!$currentYear) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'No active SACCO year found. Please contact an administrator.');
        }

        $currentQuarter = $currentYear->getCurrentQuarter();

        if (!$currentQuarter) {
            return redirect()->route('sacco.savings.index')
                ->with('error', 'No active quarter found for savings input.');
        }

        // Check if user has already saved for this quarter
        $existingSaving = MemberSaving::where('user_id', $user->id)
            ->where('sacco_quarter_id', $currentQuarter->id)
            ->first();

        if ($existingSaving) {
            return redirect()->route('sacco.savings.index')
                ->with('error', 'You have already input your savings for this quarter.');
        }

        return Inertia::render('Sacco/Savings/Create', [
            'organization' => $organization,
            'currentQuarter' => $currentQuarter,
            'currentYear' => $currentYear,
        ]);
    }

    /**
     * Store monthly savings for the quarter
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

        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:100000'],
            'quarter_id' => ['required', 'exists:sacco_quarters,id'],
        ]);

        $quarter = SaccoQuarter::findOrFail($request->quarter_id);

        // Verify quarter belongs to organization
        if ($quarter->saccoYear->organization_id !== $organizationId) {
            abort(403);
        }

        // Check if user has already saved for this quarter
        $existingSaving = MemberSaving::where('user_id', $user->id)
            ->where('sacco_quarter_id', $quarter->id)
            ->first();

        if ($existingSaving) {
            return back()->with('error', 'You have already input your savings for this quarter.');
        }

        MemberSaving::create([
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'sacco_quarter_id' => $quarter->id,
            'amount' => $request->amount,
        ]);

        return redirect()->route('sacco.savings.index')
            ->with('success', 'Savings recorded successfully!');
    }

    /**
     * Share out savings for a quarter
     */
    public function shareOut(Request $request)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'Please select an organization first.');
        }

        $request->validate([
            'saving_id' => ['required', 'exists:member_savings,id'],
        ]);

        $saving = MemberSaving::findOrFail($request->saving_id);

        // Verify saving belongs to user and organization
        if ($saving->user_id !== $user->id || $saving->organization_id !== $organizationId) {
            abort(403);
        }

        // Check if already shared out
        if ($saving->shared_out) {
            return back()->with('error', 'This saving has already been shared out.');
        }

        // Check if quarter is completed
        if (!$saving->saccoQuarter->is_completed) {
            return back()->with('error', 'Cannot share out savings until the quarter is completed.');
        }

        $saving->shareOut();

        return back()->with('success', 'Savings shared out successfully!');
    }

    /**
     * Show savings summary for admins
     */
    public function summary(Request $request)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);

        // Check admin permissions
        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        if (!in_array($userRole, ['admin', 'owner'])) {
            abort(403);
        }

        // Get current year and quarters
        $currentYear = SaccoYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        $quarters = $currentYear ? $currentYear->quarters()->with('memberSavings.user')->get() : collect();

        // Calculate summary statistics
        $summary = [];
        foreach ($quarters as $quarter) {
            $summary[] = [
                'quarter' => $quarter,
                'total_savings' => $quarter->getTotalSavings(),
                'members_count' => $quarter->memberSavings->count(),
                'shared_out_count' => $quarter->memberSavings->where('shared_out', true)->count(),
            ];
        }

        return Inertia::render('Sacco/Savings/Summary', [
            'organization' => $organization,
            'currentYear' => $currentYear,
            'summary' => $summary,
        ]);
    }
}
