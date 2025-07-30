<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show subscription management page.
     */
    public function index(Organization $organization)
    {
        $this->authorize('manageBilling', $organization);

        return Inertia::render('Subscriptions/Index', [
            'organization' => $organization->load(['owner']),
            'subscription' => $organization->subscription('default'),
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
            'intent' => $organization->createSetupIntent(),
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

        try {
            // Create Stripe Checkout Session
            $stripe = new \Stripe\StripeClient(config('cashier.secret'));

            $checkoutSession = $stripe->checkout->sessions->create([
                'customer' => $organization->createOrGetStripeCustomer()->id,
                'payment_method_types' => ['card'],
                'mode' => 'subscription',
                'line_items' => [[
                    'price' => $request->price_id,
                    'quantity' => 1,
                ]],
                'success_url' => route('subscriptions.index', $organization) . '?success=1',
                'cancel_url' => route('subscriptions.index', $organization) . '?canceled=1',
                'metadata' => [
                    'organization_id' => $organization->id,
                ],
            ]);

            return redirect($checkoutSession->url);
        } catch (\Exception $e) {
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
            'plan' => ['required', 'in:basic,pro'],
        ]);

        $planPrices = [
            'basic' => env('STRIPE_BASIC_PRICE_ID'),
            'pro' => env('STRIPE_PRO_PRICE_ID'),
        ];

        try {
            $organization->subscription('default')
                ->swapAndInvoice($planPrices[$request->plan]);

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

        return $organization->redirectToBillingPortal(
            route('subscriptions.index', $organization)
        );
    }

    /**
     * Handle Stripe webhooks.
     */
    public function webhook(Request $request)
    {
        // Use Laravel Cashier's built-in webhook handling
        $webhookController = new \Laravel\Cashier\Http\Controllers\WebhookController();
        return $webhookController->handleWebhook($request);
    }

    /**
     * Get available subscription plans.
     */
    private function getPlans(): array
    {
        return [
            [
                'id' => 'basic',
                'name' => 'Basic',
                'price' => 9.99,
                'interval' => 'month',
                'stripe_price_id' => 'price_basic_monthly', // Replace with actual Stripe price ID
                'features' => [
                    'Up to 5 team members',
                    'Basic analytics',
                    'Email support',
                ],
            ],
            [
                'id' => 'pro',
                'name' => 'Pro',
                'price' => 19.99,
                'interval' => 'month',
                'stripe_price_id' => 'price_pro_monthly', // Replace with actual Stripe price ID
                'popular' => true,
                'features' => [
                    'Unlimited team members',
                    'Advanced analytics',
                    'Priority support',
                    'API access',
                ],
            ],
        ];
    }
}
