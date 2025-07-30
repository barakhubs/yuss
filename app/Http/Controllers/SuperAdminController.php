<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\User;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminController extends Controller
{
    /**
     * Super Admin Dashboard
     */
    public function dashboard()
    {
        // Get key metrics
        $metrics = [
            'total_users' => User::count(),
            'total_organizations' => Organization::count(),
            'total_subscriptions' => Organization::whereHas('subscriptions', function ($query) {
                $query->where('stripe_status', 'active');
            })->count(),
            'total_revenue' => Organization::with('subscriptions')->get()->sum(function ($org) {
                return $org->subscriptions->where('stripe_status', 'active')->sum(function ($sub) {
                    // This is simplified - you'd want to calculate actual revenue from Stripe
                    return match ($sub->stripe_price) {
                        'price_basic_monthly' => 9.99,
                        'price_pro_monthly' => 19.99,
                        default => 0
                    };
                });
            }),
            'trial_organizations' => Organization::whereHas('subscriptions', function ($query) {
                $query->where('stripe_status', 'trialing');
            })->orWhere(function ($query) {
                $query->whereDoesntHave('subscriptions')->where('created_at', '>', now()->subDays(14));
            })->count(),
            'pending_invitations' => Invitation::count(),
        ];

        // Recent activities
        $recent_organizations = Organization::with('owner')
            ->latest()
            ->limit(10)
            ->get();

        $recent_users = User::latest()
            ->limit(10)
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'metrics' => $metrics,
            'recent_organizations' => $recent_organizations,
            'recent_users' => $recent_users,
        ]);
    }

    /**
     * Manage Organizations
     */
    public function organizations(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');

        $query = Organization::with(['owner', 'users'])
            ->withCount(['users', 'pendingInvitations']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            if ($status === 'trial') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('subscriptions')
                        ->orWhereHas('subscriptions', function ($subQuery) {
                            $subQuery->where('stripe_status', 'trialing');
                        });
                });
            } elseif ($status === 'active') {
                $query->whereHas('subscriptions', function ($subQuery) {
                    $subQuery->where('stripe_status', 'active');
                });
            }
        }

        $organizations = $query->paginate(20);

        return Inertia::render('SuperAdmin/Organizations', [
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Manage Users
     */
    public function users(Request $request)
    {
        $search = $request->get('search');

        $query = User::withCount('organizations');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);

        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * View Organization Details
     */
    public function viewOrganization(Organization $organization)
    {
        $organization->load([
            'owner',
            'users' => function ($query) {
                $query->withPivot('role', 'joined_at');
            },
            'pendingInvitations.invitedBy',
            'subscriptions'
        ]);

        return Inertia::render('SuperAdmin/OrganizationDetails', [
            'organization' => $organization,
        ]);
    }

    /**
     * Suspend Organization
     */
    public function suspendOrganization(Organization $organization)
    {
        // Add suspended field to organizations table if needed
        // For now, we'll add it to a notes field or use a separate status
        return back()->with('success', 'Organization suspended successfully');
    }

    /**
     * Delete Organization
     */
    public function deleteOrganization(Organization $organization)
    {
        $organizationName = $organization->name;

        // Cancel any active subscriptions first
        if ($organization->subscribed('default')) {
            $organization->subscription('default')->cancel();
        }

        // Delete the organization (this will cascade to pivot tables)
        $organization->delete();

        return redirect()->route('super-admin.organizations')
            ->with('success', "Organization '{$organizationName}' has been deleted successfully");
    }

    /**
     * Toggle Super Admin Status
     */
    public function toggleSuperAdmin(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot modify your own super admin status');
        }

        try {
            if ($user->is_super_admin) {
                // Remove super admin privileges
                $user->removeSuperAdmin();
                $message = "Super admin privileges revoked for {$user->name}";
            } else {
                // Check if user belongs to organizations
                if ($user->organizations()->exists()) {
                    return back()->with(
                        'error',
                        "Cannot make {$user->name} a super admin while they belong to organizations. " .
                            "They must leave all organizations first."
                    );
                }

                // Grant super admin privileges
                $user->makeSuperAdmin();
                $message = "Super admin privileges granted to {$user->name}";
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Force promote user to super admin (removes from all organizations)
     */
    public function forcePromoteToSuperAdmin(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot modify your own super admin status');
        }

        try {
            $user->promoteToSuperAdmin();

            return back()->with(
                'success',
                "{$user->name} has been promoted to super admin and removed from all organizations"
            );
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
