<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Quarter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Check admin permissions
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
     * Set a quarter as active (Admin only)
     */
    public function setActive(Request $request, Quarter $quarter)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage quarters.');
        }

        // Deactivate all other quarters
        Quarter::query()->update(['status' => 'inactive']);

        // Activate the selected quarter
        $quarter->update(['status' => 'active']);

        return back()->with('success', "Q{$quarter->quarter_number} {$quarter->year} has been set as the active quarter.");
    }

    /**
     * Create a new quarter (Admin only)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check admin permissions
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage quarters.');
        }

        $request->validate([
            'quarter_number' => ['required', 'integer', 'min:1', 'max:3'],
            'year' => ['required', 'integer', 'min:2020', 'max:2050'],
        ]);

        // Check if quarter already exists
        $existingQuarter = Quarter::where('quarter_number', $request->quarter_number)
            ->where('year', $request->year)
            ->first();

        if ($existingQuarter) {
            return back()->with('error', "Q{$request->quarter_number} {$request->year} already exists.");
        }

        $quarter = Quarter::create([
            'quarter_number' => $request->quarter_number,
            'year' => $request->year,
            'status' => 'inactive',
        ]);

        return back()->with('success', "Q{$quarter->quarter_number} {$quarter->year} has been created.");
    }
}
