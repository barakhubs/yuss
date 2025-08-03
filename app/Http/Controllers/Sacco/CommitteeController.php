<?php

namespace App\Http\Controllers\Sacco;

use App\Http\Controllers\Controller;
use App\Models\Committee;
use App\Models\CommitteeMember;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CommitteeController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of committees
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Build query with filters
        $query = Committee::with(['chairman', 'secretary'])
            ->withCount('members');

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Paginate results
        $committees = $query->orderBy('created_at', 'desc')->paginate(15);

        // Get statistics
        $statistics = [
            'total_committees' => Committee::count(),
            'active_committees' => Committee::where('status', 'active')->count(),
            'total_members' => CommitteeMember::count(),
            'committees_by_type' => Committee::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
        ];

        return Inertia::render('Sacco/Committees/Index', [
            'committees' => $committees,
            'filters' => $request->only(['search', 'status', 'type']),
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new committee
     */
    public function create()
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        // Get available users for leadership roles
        $availableUsers = $organization->users()->get(['users.id', 'users.name', 'users.email']);

        return Inertia::render('Sacco/Committees/Create', [
            'availableUsers' => $availableUsers,
        ]);
    }

    /**
     * Store a newly created committee
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Please select an organization first.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['management', 'loan_review', 'audit', 'disciplinary', 'other'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'chairman_id' => 'nullable|exists:users,id',
            'secretary_id' => 'nullable|exists:users,id|different:chairman_id',
        ]);

        $committee = Committee::create([
            'organization_id' => $organizationId,
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'status' => $request->status,
            'chairman_id' => $request->chairman_id === 'none' ? null : $request->chairman_id,
            'secretary_id' => $request->secretary_id === 'none' ? null : $request->secretary_id,
        ]);

        // Add chairman and secretary as members if specified
        if ($request->chairman_id && $request->chairman_id !== 'none') {
            $committee->members()->create([
                'user_id' => $request->chairman_id,
                'role' => 'chairman',
                'joined_at' => now(),
            ]);
        }

        if ($request->secretary_id && $request->secretary_id !== 'none') {
            $committee->members()->create([
                'user_id' => $request->secretary_id,
                'role' => 'secretary',
                'joined_at' => now(),
            ]);
        }

        return redirect()->route('sacco.committees.show', $committee)
            ->with('success', 'Committee created successfully.');
    }

    /**
     * Display the specified committee
     */
    public function show(Committee $committee)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);

        // Check if user has access
        if (!$user->organizations()->where('organization_id', $organizationId)->exists()) {
            return redirect()->route('organizations.index')
                ->with('error', 'You do not have access to this organization.');
        }

        $userRole = $user->organizations()
            ->where('organization_id', $organizationId)
            ->first()
            ->pivot
            ->role;

        $canEdit = in_array($userRole, ['admin', 'owner']);

        // Load committee with all members
        $committee->load(['members.user', 'chairman', 'secretary']);

        // Get available users for adding members
        $availableUsers = [];
        if ($canEdit) {
            $existingMemberIds = $committee->members->pluck('user_id')->toArray();
            $availableUsers = $organization->users()
                ->whereNotIn('users.id', $existingMemberIds)
                ->get(['users.id', 'users.name', 'users.email']);
        }

        return Inertia::render('Sacco/Committees/Show', [
            'committee' => $committee,
            'availableUsers' => $availableUsers,
            'canEdit' => $canEdit,
        ]);
    }

    /**
     * Show the form for editing the specified committee
     */
    public function edit(Committee $committee)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        // Load committee with members
        $committee->load(['members.user', 'chairman', 'secretary']);

        // Get available users for leadership roles
        $availableUsers = $organization->users()->get(['users.id', 'users.name', 'users.email']);

        return Inertia::render('Sacco/Committees/Edit', [
            'committee' => $committee,
            'availableUsers' => $availableUsers,
        ]);
    }

    /**
     * Update the specified committee
     */
    public function update(Request $request, Committee $committee)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['management', 'loan_review', 'audit', 'disciplinary', 'other'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'chairman_id' => 'nullable|exists:users,id',
            'secretary_id' => 'nullable|exists:users,id|different:chairman_id',
        ]);

        // Update committee
        $committee->update([
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'status' => $request->status,
            'chairman_id' => $request->chairman_id ?: null,
            'secretary_id' => $request->secretary_id ?: null,
        ]);

        // Update leadership roles in members table
        $committee->members()->update(['role' => 'member']);

        if ($request->chairman_id) {
            $member = $committee->members()->where('user_id', $request->chairman_id)->first();
            if ($member) {
                $member->update(['role' => 'chairman']);
            } else {
                $committee->members()->create([
                    'user_id' => $request->chairman_id,
                    'role' => 'chairman',
                    'joined_at' => now(),
                ]);
            }
        }

        if ($request->secretary_id) {
            $member = $committee->members()->where('user_id', $request->secretary_id)->first();
            if ($member) {
                $member->update(['role' => 'secretary']);
            } else {
                $committee->members()->create([
                    'user_id' => $request->secretary_id,
                    'role' => 'secretary',
                    'joined_at' => now(),
                ]);
            }
        }

        return redirect()->route('sacco.committees.show', $committee)
            ->with('success', 'Committee updated successfully.');
    }

    /**
     * Remove the specified committee
     */
    public function destroy(Committee $committee)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        $committee->delete();

        return redirect()->route('sacco.committees.index')
            ->with('success', 'Committee deleted successfully.');
    }

    /**
     * Add a member to the committee
     */
    public function addMember(Request $request, Committee $committee)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => ['required', Rule::in(['chairman', 'secretary', 'member'])],
            'notes' => 'nullable|string',
        ]);

        // Check if user is already a member
        if ($committee->members()->where('user_id', $request->user_id)->exists()) {
            return back()->withErrors(['user_id' => 'This user is already a member of the committee.']);
        }

        // Check if user is organization member
        if (!$organization->users()->where('user_id', $request->user_id)->exists()) {
            return back()->withErrors(['user_id' => 'User must be a member of the organization.']);
        }

        $committee->members()->create([
            'user_id' => $request->user_id,
            'role' => $request->role,
            'joined_at' => now(),
            'notes' => $request->notes,
        ]);

        // Update committee leadership if needed
        if ($request->role === 'chairman') {
            $committee->update(['chairman_id' => $request->user_id]);
        } elseif ($request->role === 'secretary') {
            $committee->update(['secretary_id' => $request->user_id]);
        }

        return back()->with('success', 'Member added to committee successfully.');
    }

    /**
     * Remove a member from the committee
     */
    public function removeMember(Committee $committee, CommitteeMember $member)
    {
        $user = Auth::user();
        $organizationId = session('current_organization_id');

        if (!$organizationId || $committee->organization_id !== $organizationId) {
            return redirect()->route('organizations.index')
                ->with('error', 'Committee not found.');
        }

        $organization = Organization::findOrFail($organizationId);
        $this->authorize('update', $organization);

        // Check if member belongs to this committee
        if ($member->committee_id !== $committee->id) {
            return back()->withErrors(['error' => 'Member not found in this committee.']);
        }

        // Update committee leadership if needed
        if ($member->role === 'chairman') {
            $committee->update(['chairman_id' => null]);
        } elseif ($member->role === 'secretary') {
            $committee->update(['secretary_id' => null]);
        }

        $member->delete();

        return back()->with('success', 'Member removed from committee successfully.');
    }
}
