<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $organizations = Auth::user()->organizations()->with('owner')->get();

        return Inertia::render('Organizations/Index', [
            'organizations' => $organizations,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();

        // Check if user already belongs to an organization
        if ($user->organizations()->exists()) {
            return redirect()->route('dashboard')
                ->with('error', 'You can only belong to one organization. Please leave your current organization before creating a new one.');
        }

        // Super admins cannot create organizations
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard')
                ->with('error', 'Super admins cannot create or belong to organizations.');
        }

        return Inertia::render('Organizations/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user already belongs to an organization
        if ($user->organizations()->exists()) {
            return redirect()->route('dashboard')
                ->with('error', 'You can only belong to one organization. Please leave your current organization before creating a new one.');
        }

        // Super admins cannot create organizations
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard')
                ->with('error', 'Super admins cannot create or belong to organizations.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
        ]);

        $organization = Organization::create([
            'name' => $request->name,
            'description' => $request->description,
            'website' => $request->website,
            'owner_id' => Auth::id(),
            'trial_ends_at' => now()->addDays(14), // 14-day trial
        ]);

        // Add the owner as an admin
        try {
            $organization->addUser($user, 'admin');
        } catch (\Exception $e) {
            // If adding user fails, delete the organization and return error
            $organization->delete();
            return redirect()->route('dashboard')
                ->with('error', $e->getMessage());
        }

        return redirect()->route('organizations.show', $organization)
            ->with('success', 'Organization created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Organization $organization)
    {
        $this->authorize('view', $organization);

        $organization->load([
            'users' => function ($query) {
                $query->withPivot('role', 'joined_at')->orderBy('pivot_joined_at');
            },
            'pendingInvitations.invitedBy',
            'owner'
        ]);

        $userRole = $this->getUserRole($organization);
        $canManage = in_array($userRole, ['owner', 'admin']);

        return Inertia::render('Organizations/Show', [
            'organization' => array_merge($organization->toArray(), [
                'users_count' => $organization->users->count(),
                'pending_invitations_count' => $organization->pendingInvitations->count(),
                'on_trial' => $organization->onTrial(),
                'has_active_subscription' => $organization->hasActiveSubscription(),
                'is_owner' => $userRole === 'owner',
                'user_role' => $userRole,
            ]),
            'users' => $organization->users,
            'invitations' => $organization->pendingInvitations,
            'can_manage' => $canManage,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Organization $organization)
    {
        $this->authorize('update', $organization);

        return Inertia::render('Organizations/Edit', [
            'organization' => $organization,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Organization $organization)
    {
        $this->authorize('update', $organization);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
        ]);

        $organization->update($request->only(['name', 'description', 'website']));

        return redirect()->route('organizations.show', $organization)
            ->with('success', 'Organization updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Organization $organization)
    {
        $this->authorize('delete', $organization);

        $organization->delete();

        return redirect()->route('organizations.index')
            ->with('success', 'Organization deleted successfully!');
    }

    /**
     * Switch to a different organization.
     */
    public function switch(Organization $organization)
    {
        $this->authorize('view', $organization);

        session(['current_organization_id' => $organization->id]);

        return redirect()->route('dashboard')
            ->with('success', "Switched to {$organization->name}");
    }

    /**
     * Remove a user from the organization.
     */
    public function removeUser(Organization $organization, Request $request)
    {
        $this->authorize('manageUsers', $organization);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $user = \App\Models\User::findOrFail($request->user_id);

        // Prevent removing the owner
        if ($organization->owner_id === $user->id) {
            return back()->with('error', 'Cannot remove the organization owner.');
        }

        $organization->removeUser($user);

        return back()->with('success', 'User removed from organization.');
    }

    /**
     * Update a user's role in the organization.
     */
    public function updateUserRole(Organization $organization, Request $request)
    {
        $this->authorize('manageUsers', $organization);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'in:admin,member'],
        ]);

        $user = \App\Models\User::findOrFail($request->user_id);

        // Prevent changing owner's role
        if ($organization->owner_id === $user->id) {
            return back()->with('error', 'Cannot change the organization owner\'s role.');
        }

        try {
            $organization->updateUserRole($user, $request->role);
            return back()->with('success', 'User role updated successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get the current user's role in the organization.
     */
    private function getUserRole(Organization $organization): ?string
    {
        if ($organization->owner_id === Auth::id()) {
            return 'owner';
        }

        $pivot = $organization->users()->where('user_id', Auth::id())->first()?->pivot;

        return $pivot?->role;
    }
}
