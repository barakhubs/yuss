<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\Quarter;
use App\Models\MemberSavingsTarget;
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

        // Get user's savings with related data
        $savings = $user->savings()
            ->with(['quarter'])
            ->latest()
            ->paginate(15);

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        // Check if user has savings target for current quarter
        $currentTarget = null;
        $quarterSaved = 0;
        if ($currentQuarter) {
            $currentTarget = $user->savingsTargets()
                ->where('quarter_id', $currentQuarter->id)
                ->first();
            $quarterSaved = $user->getSavingsForQuarter($currentQuarter);
        }

        // Get available quarters for filter
        $quarters = Quarter::orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->get();

        // Summary stats
        $stats = [
            'total_savings' => $user->getCurrentSavingsBalance(),
            'quarter_target' => $currentTarget?->target_amount ?? 0,
            'quarter_saved' => $quarterSaved,
        ];

        return Inertia::render('Sacco/Savings/Index', [
            'savings' => $savings,
            'stats' => $stats,
            'currentQuarter' => $currentQuarter,
            'currentTarget' => $currentTarget,
            'quarters' => $quarters,
        ]);
    }

    /**
     * Show form to input monthly savings
     */
    public function create()
    {
        $user = Auth::user();

        // Get current active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();

        if (!$currentQuarter) {
            return redirect()->route('sacco.savings.index')
                ->with('error', 'No active quarter found for savings input.');
        }

        // Check if user has savings target for this quarter
        $currentTarget = $user->savingsTargets()
            ->where('quarter_id', $currentQuarter->id)
            ->first();

        // Check how much user has already saved this quarter
        $quarterSaved = $user->getSavingsForQuarter($currentQuarter);

        return Inertia::render('Sacco/Savings/Create', [
            'currentQuarter' => $currentQuarter,
            'currentTarget' => $currentTarget,
            'quarterSaved' => $quarterSaved,
        ]);
    }

    /**
     * Store monthly savings for the quarter
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:100000'],
            'quarter_id' => ['required', 'exists:quarters,id'],
        ]);

        $quarter = Quarter::findOrFail($request->quarter_id);

        // Verify quarter is active
        if ($quarter->status !== 'active') {
            return back()->with('error', 'Can only save to active quarters.');
        }

        // Create the savings record
        Saving::create([
            'user_id' => $user->id,
            'quarter_id' => $quarter->id,
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

        $request->validate([
            'saving_id' => ['required', 'exists:savings,id'],
        ]);

        $saving = Saving::findOrFail($request->saving_id);

        // Verify saving belongs to user
        if ($saving->user_id !== $user->id) {
            abort(403);
        }

        // Check if already shared out
        if ($saving->shared_out) {
            return back()->with('error', 'This saving has already been shared out.');
        }

        // Check if quarter is completed
        if ($saving->quarter->status !== 'completed') {
            return back()->with('error', 'Cannot share out savings until the quarter is completed.');
        }

        $saving->update(['shared_out' => true, 'shared_out_at' => now()]);

        return back()->with('success', 'Savings shared out successfully!');
    }

    /**
     * Show savings summary for admins
     */
    public function summary(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->hasRole('admin')) {
            abort(403);
        }

        // Get all quarters with savings data
        $quarters = Quarter::with(['savings.user'])
            ->orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->get();

        // Calculate summary statistics for each quarter
        $summary = $quarters->map(function ($quarter) {
            $totalSavings = $quarter->savings->sum('amount');
            $membersCount = $quarter->savings->count();
            $sharedOutCount = $quarter->savings->where('shared_out', true)->count();

            return [
                'quarter' => $quarter,
                'total_savings' => $totalSavings,
                'members_count' => $membersCount,
                'shared_out_count' => $sharedOutCount,
                'completion_rate' => $membersCount > 0 ? round(($sharedOutCount / $membersCount) * 100, 2) : 0,
            ];
        });

        return Inertia::render('Sacco/Savings/Summary', [
            'summary' => $summary,
        ]);
    }
}
