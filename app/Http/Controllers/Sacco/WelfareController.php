<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WelfareClaim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WelfareController extends Controller
{
    /**
     * Display all welfare claims (Admin only)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can manage welfare claims.');
        }

        $query = WelfareClaim::with(['member', 'initiatedBy'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('member', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $claims = $query->paginate(15);

        // Members eligible for welfare (active, with a savings category)
        $members = User::where('is_verified', true)
            ->whereNotNull('savings_category')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'savings_category']);

        return Inertia::render('sacco/admin/welfare/Index', [
            'claims'  => $claims,
            'members' => $members,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Initiate a new welfare claim (Admin only)
     */
    public function store(Request $request)
    {
        $admin = Auth::user();

        if (!$admin->isAdmin()) {
            abort(403, 'Only administrators can initiate welfare claims.');
        }

        $request->validate([
            'user_id'          => ['required', 'exists:users,id'],
            'claim_type'       => ['required', 'in:bereavement,wedding,ceremonial_introduction'],
            'event_date'       => ['required', 'date', 'before_or_equal:today'],
            'beneficiary_name' => ['required', 'string', 'max:255'],
            'notes'            => ['nullable', 'string', 'max:1000'],
        ]);

        $member = User::findOrFail($request->user_id);

        if (!$member->savings_category) {
            return back()->with('error', 'This member does not have a savings category assigned.');
        }

        $welfare = $member->getWelfarePayout();

        if (!$welfare) {
            return back()->with('error', 'Could not determine welfare payout for this member.');
        }

        WelfareClaim::create([
            'user_id'          => $member->id,
            'claimed_by'       => $admin->id,
            'claim_type'       => $request->claim_type,
            'event_date'       => $request->event_date,
            'beneficiary_name' => $request->beneficiary_name,
            'notes'            => $request->notes,
            'group_contribution' => $welfare['group_contribution'],
            'yukon_contribution' => $welfare['yukon_contribution'],
            'total_payout'       => $welfare['total_payout'],
            'status'           => 'initiated',
        ]);

        return back()->with('success', "Welfare support initiated for {$member->name}. Total payout: €{$welfare['total_payout']}.");
    }

    /**
     * Mark a welfare claim as paid (Admin only)
     */
    public function markPaid(WelfareClaim $claim)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can update welfare claims.');
        }

        if ($claim->isPaid()) {
            return back()->with('error', 'This claim has already been marked as paid.');
        }

        $claim->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        return back()->with('success', "Welfare claim for {$claim->member->name} marked as paid (€{$claim->total_payout}).");
    }
}
