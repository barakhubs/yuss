<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with SaaS metrics.
     */
    public function index()
    {
        $user = Auth::user();
        // Check if user already belongs to an organization
        Log::info('User accessed dashboard', ['user_id' => $user->id]);
        Log::info('User role: ' . $user->role);
        Log::info('User is super admin: ' . ($user->isSuperAdmin() ? 'Yes' : 'No'));
        if ($user->isSuperAdmin()) {
            Log::info('Super admin accessed dashboard', ['user_id' => $user->id]);
            return redirect()->route('super-admin.dashboard')
                ->with('error', 'You can only access super admin dashboard.');
        }

        // Get user's organizations with counts
        $organizations = $user->organizations()
            ->withCount('users')
            ->with(['owner', 'pendingInvitations', 'plan'])
            ->get()
            ->map(function ($org) use ($user) {
                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'description' => $org->description,
                    'users_count' => $org->users_count,
                    'pending_invitations_count' => $org->pendingInvitations->count(),
                    'trial_ends_at' => $org->trial_ends_at,
                    'on_trial' => $org->onTrial(),
                    'has_active_subscription' => $org->hasActiveSubscription(),
                    'is_owner' => $org->owner_id === $user->id,
                    'user_role' => $org->pivot->role,
                    'subscription_status' => $this->getSubscriptionStatus($org),
                ];
            });

        // Get current organization (first one for now)
        $currentOrganization = $organizations->first();

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
                'can_create_organization' => $user->canCreateOrganization(),
            ],
        ]);
    }

    /**
     * Get a human-readable subscription status for an organization.
     */
    private function getSubscriptionStatus($organization): string
    {
        try {
            if ($organization->subscribed('default')) {
                $subscription = $organization->subscription('default');
                if ($subscription->canceled()) {
                    return 'Cancelled';
                }
                if ($subscription->onGracePeriod()) {
                    return 'Ending Soon';
                }
                return 'Active';
            }

            if ($organization->onTrial()) {
                return 'Trial';
            }

            return 'No Subscription';
        } catch (\Exception $e) {
            // If there's any error checking subscription status, default to trial or no subscription
            return $organization->onTrial() ? 'Trial' : 'No Subscription';
        }
    }
}
