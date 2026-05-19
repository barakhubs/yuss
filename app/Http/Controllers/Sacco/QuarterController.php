<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Quarter;
use App\Models\Saving;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuarterController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display quarter management page (Admin only)
     */
    public function index()
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage quarters.');
        }

        $quarters = Quarter::orderBy('year', 'desc')
            ->orderBy('quarter_number', 'desc')
            ->paginate(15);

        return Inertia::render('sacco/admin/settings/Quarters', [
            'quarters' => $quarters,
        ]);
    }

    /**
     * Set a quarter as active (Admin only).
     * If the previously active/completed quarter had no share-out,
     * returns a needs_rollover flag so the frontend can prompt the user.
     */
    public function setActive(Request $request, Quarter $quarter)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage quarters.');
        }

        // Find any quarter that was active/completed with savings but no share-out
        $rolloverCandidate = Quarter::where('id', '!=', $quarter->id)
            ->whereIn('status', ['active', 'completed'])
            ->where('shareout_activated', false)
            ->whereHas('savings')
            ->orderByDesc('year')
            ->orderByDesc('quarter_number')
            ->first();

        // Show the prompt only on the first click (confirm_rollover key absent).
        // An explicit confirm_rollover=0 means "skip" — boolean() can't distinguish
        // that from a missing value, so we use has() instead.
        if ($rolloverCandidate && !$request->has('confirm_rollover')) {
            $rolloverTotal = Saving::where('quarter_id', $rolloverCandidate->id)
                ->where('rolled_over', false)
                ->sum('amount');

            return back()->with('rollover_required', [
                'from_quarter_id'     => $rolloverCandidate->id,
                'from_quarter_name'   => "Q{$rolloverCandidate->quarter_number} {$rolloverCandidate->year}",
                'to_quarter_id'       => $quarter->id,
                'to_quarter_name'     => "Q{$quarter->quarter_number} {$quarter->year}",
                'total_savings'       => $rolloverTotal,
            ]);
        }

        DB::transaction(function () use ($quarter, $rolloverCandidate, $request) {
            // Optionally roll over savings
            if ($rolloverCandidate && $request->boolean('confirm_rollover')) {
                $this->performRollover($rolloverCandidate, $quarter);
            }

            // Deactivate all quarters, then activate the selected one
            Quarter::query()->update(['status' => 'inactive']);
            $quarter->update(['status' => 'active']);
        });

        return back()->with('success', "Q{$quarter->quarter_number} {$quarter->year} has been set as the active quarter.");
    }

    /**
     * Explicitly roll over savings from one quarter to another (Admin only).
     */
    public function rolloverSavings(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can roll over savings.');
        }

        $request->validate([
            'from_quarter_id' => ['required', 'exists:quarters,id'],
            'to_quarter_id'   => ['required', 'exists:quarters,id', 'different:from_quarter_id'],
        ]);

        $fromQuarter = Quarter::findOrFail($request->from_quarter_id);
        $toQuarter   = Quarter::findOrFail($request->to_quarter_id);

        if ($fromQuarter->shareout_activated) {
            return back()->with('error', "Q{$fromQuarter->quarter_number} {$fromQuarter->year} already had a share-out activated — rollover is not applicable.");
        }

        $rolledCount = $this->performRollover($fromQuarter, $toQuarter);

        return back()->with('success', "Rolled over savings from Q{$fromQuarter->quarter_number} {$fromQuarter->year} to Q{$toQuarter->quarter_number} {$toQuarter->year} ({$rolledCount} member(s)).");
    }

    /**
     * Create a new quarter (Admin only)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage quarters.');
        }

        $request->validate([
            'quarter_number' => ['required', 'integer', 'min:1', 'max:3'],
            'year'           => ['required', 'integer', 'min:2020', 'max:2050'],
        ]);

        $existingQuarter = Quarter::where('quarter_number', $request->quarter_number)
            ->where('year', $request->year)
            ->first();

        if ($existingQuarter) {
            return back()->with('error', "Q{$request->quarter_number} {$request->year} already exists.");
        }

        $quarter = Quarter::create([
            'quarter_number' => $request->quarter_number,
            'year'           => $request->year,
            'status'         => 'inactive',
        ]);

        return back()->with('success', "Q{$quarter->quarter_number} {$quarter->year} has been created.");
    }

    // -------------------------------------------------------------------------

    private function performRollover(Quarter $fromQuarter, Quarter $toQuarter): int
    {
        $savings = Saving::where('quarter_id', $fromQuarter->id)
            ->where('rolled_over', false)
            ->get();

        if ($savings->isEmpty()) {
            return 0;
        }

        // Group by user and create one rollover saving per member in the new quarter
        $grouped = $savings->groupBy('user_id');
        $rolledCount = 0;

        foreach ($grouped as $userId => $userSavings) {
            $total = $userSavings->sum('amount');

            // Idempotency guard — skip if a rollover record already exists for
            // this member in the target quarter (prevents doubling on re-runs).
            if (Saving::where('user_id', $userId)
                ->where('quarter_id', $toQuarter->id)
                ->where('notes', 'like', 'Rolled over from%')
                ->exists()
            ) {
                continue;
            }

            Saving::create([
                'user_id'    => $userId,
                'quarter_id' => $toQuarter->id,
                'amount'     => $total,
                'saved_on'   => now()->toDateString(),
                'notes'      => "Rolled over from Q{$fromQuarter->quarter_number} {$fromQuarter->year} (no share-out)",
                'recorded_by' => Auth::id(),
            ]);

            // Mark all source savings as rolled over
            foreach ($userSavings as $saving) {
                $saving->update([
                    'rolled_over'          => true,
                    'rolled_to_quarter_id' => $toQuarter->id,
                ]);
            }

            $rolledCount++;
        }

        return $rolledCount;
    }
}
