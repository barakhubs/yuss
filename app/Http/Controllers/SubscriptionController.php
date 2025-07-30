<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Plan;
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
            'organization' => $organization->load(['owner', 'plan']),
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

        // Validate that the price_id exists in our active plans
        $plan = Plan::where('is_active', true)
            ->where('stripe_price_id', $request->price_id)
            ->first();

        if (!$plan) {
            return back()->with('error', 'Invalid plan selected.');
        }

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
                    'plan_id' => $plan->id,
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
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('cashier.webhook.secret');

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            return response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            return response('Invalid signature', 400);
        }

        // Handle subscription created event
        if ($event['type'] === 'checkout.session.completed') {
            $session = $event['data']['object'];
            
            if ($session['mode'] === 'subscription' && isset($session['metadata']['organization_id'])) {
                $this->handleSubscriptionCreated($session);
            }
        }

        // Use Laravel Cashier's built-in webhook handling for other events
        $webhookController = new \Laravel\Cashier\Http\Controllers\WebhookController();
        return $webhookController->handleWebhook($request);
    }

    /**
     * Handle subscription created event.
     */
    private function handleSubscriptionCreated($session)
    {
        $organizationId = $session['metadata']['organization_id'];
        $planId = $session['metadata']['plan_id'] ?? null;

        if ($organizationId && $planId) {
            $organization = Organization::find($organizationId);
            if ($organization) {
                $organization->update(['plan_id' => $planId]);
            }
        }
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
                    'stripe_price_id' => $plan->stripe_price_id,
                    'popular' => $plan->is_featured,
                    'features' => $plan->features->map(function ($feature) {
                        return $feature->description ?? $feature->name;
                    })->toArray(),
                ];
            })
            ->toArray();
    }
}
