<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Plan;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravel\Paddle\Cashier;

class SubscriptionController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show subscription management page.
     */
    public function index(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        $organization->load(['owner', 'plan']);
        $paddleSubscription = $organization->subscription('default');

        // Create a unified subscription object that handles both free and paid plans
        $subscription = null;
        if ($organization->plan) {
            if ($organization->plan->price > 0 && $paddleSubscription) {
                // Paid plan with Paddle subscription
                $subscription = [
                    'id' => $paddleSubscription->id,
                    'paddle_id' => $paddleSubscription->paddle_id,
                    'paddle_status' => $paddleSubscription->paddle_status,
                    'paddle_price' => $paddleSubscription->paddle_price,
                    'quantity' => $paddleSubscription->quantity,
                    'trial_ends_at' => $paddleSubscription->trial_ends_at?->toISOString(),
                    'ends_at' => $paddleSubscription->ends_at?->toISOString(),
                    'created_at' => $paddleSubscription->created_at->toISOString(),
                    'updated_at' => $paddleSubscription->updated_at->toISOString(),
                    'plan_name' => $organization->plan->name,
                ];
            } elseif ($organization->plan->price == 0) {
                // Free plan without Paddle subscription
                $subscription = [
                    'id' => 'free_plan',
                    'paddle_id' => null,
                    'paddle_status' => 'active',
                    'paddle_price' => $organization->plan->paddle_price_id ?? $organization->plan->slug,
                    'quantity' => 1,
                    'trial_ends_at' => null,
                    'ends_at' => null,
                    'created_at' => $organization->updated_at->toISOString(),
                    'updated_at' => $organization->updated_at->toISOString(),
                    'plan_name' => $organization->plan->name,
                ];
            }
        }

        return Inertia::render('Subscriptions/Index', [
            'organization' => $organization,
            'subscription' => $subscription,
            'onTrial' => $organization->onTrial(),
            'plans' => $this->getPlans(),
        ]);
    }

    /**
     * Show subscription checkout page.
     */
    public function create(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        return Inertia::render('Subscriptions/Create', [
            'organization' => $organization,
            'plans' => $this->getPlans(),
        ]);
    }

    /**
     * Create a new subscription.
     */
    public function store(Request $request, Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        $request->validate([
            'price_id' => ['required', 'string'],
        ]);

        // Validate that the price_id exists in our active plans
        $plan = Plan::where('is_active', true)
            ->where(function ($query) use ($request) {
                // First try to find by paddle_price_id
                $query->where('paddle_price_id', $request->price_id)
                    // Or by slug (for free plans or if price_id is actually a slug)
                    ->orWhere('slug', $request->price_id);
            })
            ->first();

        if (!$plan) {
            return back()->with('error', 'Invalid plan selected.');
        }

        // Handle free plans (no Paddle required)
        if ($plan->price == 0.00 || is_null($plan->paddle_price_id)) {
            $organization->update(['plan_id' => $plan->id]);

            return redirect()->route('subscriptions.index', $organization)
                ->with('success', 'Successfully subscribed to ' . $plan->name . '!');
        }

        try {
            // Create Paddle Checkout for paid plans
            $checkout = $organization->checkout($plan->paddle_price_id, 1, [
                'success_url' => route('subscriptions.index', $organization) . '?success=1',
                'cancel_url' => route('subscriptions.index', $organization) . '?canceled=1',
                'custom_data' => [
                    'organization_id' => $organization->id,
                    'plan_id' => $plan->id,
                ],
            ]);

            return $checkout->redirect();
        } catch (\Exception $e) {
            Log::error('Failed to create Paddle Checkout', [
                'error' => $e->getMessage(),
                'organization_id' => $organization->id,
                'price_id' => $request->price_id,
            ]);
            return back()->with('error', 'Failed to create checkout session: ' . $e->getMessage());
        }
    }

    /**
     * Update subscription plan.
     */
    public function update(Request $request, Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        $request->validate([
            'plan' => ['required', 'string'],
        ]);

        $plan = Plan::where('slug', $request->plan)->where('is_active', true)->first();

        if (!$plan) {
            return back()->with('error', 'Invalid plan selected.');
        }

        try {
            $organization->subscription('default')->swap($plan->paddle_price_id);

            return back()->with('success', 'Subscription updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update subscription: ' . $e->getMessage());
        }
    }

    /**
     * Cancel subscription.
     */
    public function cancel(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        try {
            $organization->subscription('default')->cancel();

            return back()->with('success', 'Subscription cancelled. You will retain access until the end of your billing period.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    /**
     * Resume cancelled subscription.
     */
    public function resume(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        try {
            $organization->subscription('default')->resume();

            return back()->with('success', 'Subscription resumed successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to resume subscription: ' . $e->getMessage());
        }
    }

    /**
     * Show billing portal.
     */
    public function portal(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        // Paddle doesn't have a billing portal like Stripe
        // You might want to redirect to your own billing management page
        return redirect()->route('subscriptions.index', $organization)
            ->with('info', 'Billing management is handled through your subscription page.');
    }

    /**
     * Handle Paddle webhooks.
     */
    public function webhook(Request $request)
    {
        // Use Laravel Paddle's built-in webhook handling
        $webhook = new \Laravel\Paddle\Http\Controllers\WebhookController();
        return $webhook->handleWebhook($request);
    }

    /**
     * Get available subscription plans.
     */
    private function getPlans(): array
    {
        return Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->slug,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'price' => (float) $plan->price,
                    'interval' => $plan->billing_period === 'monthly' ? 'month' : 'year',
                    'stripe_price_id' => $plan->paddle_price_id ?? $plan->slug, // Use slug for free plans but keep frontend field name
                    'popular' => $plan->is_featured,
                    'features' => $plan->features->map(function ($feature) {
                        return $feature->description ?? $feature->name;
                    })->toArray(),
                ];
            })
            ->toArray();
    }
}
