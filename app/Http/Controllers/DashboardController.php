<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index()
    {
        $user = Auth::user();

        // Get user's organizations with counts
        $organizations = $user->organizations()
            ->withCount('users')
            ->with(['owner', 'pendingInvitations'])
            ->get()
            ->map(function ($org) use ($user) {
                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'description' => $org->description,
                    'users_count' => $org->users_count,
                    'pending_invitations_count' => $org->pendingInvitations->count(),
                    'is_owner' => $org->owner_id === $user->id,
                    'user_role' => $org->pivot->role,
                ];
            });

        // Get current organization (first one for now)
        $currentOrganization = $organizations->first();

        // Auto-set organization session if user has one and none is set
        if ($currentOrganization && !session('current_organization_id')) {
            session(['current_organization_id' => $currentOrganization['id']]);
        }

        // Calculate metrics
        $metrics = [
            'total_organizations' => $organizations->count(),
            'organizations_owned' => $organizations->where('is_owner', true)->count(),
            'total_team_members' => $organizations->sum('users_count'),
            'pending_invitations' => $organizations->sum('pending_invitations_count'),
        ];

        return Inertia::render('Dashboard', [
            'organizations' => $organizations,
            'currentOrganization' => $currentOrganization,
            'metrics' => $metrics,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'can_create_organization' => !$user->organizations()->exists(),
            ],
        ]);
    }
}
