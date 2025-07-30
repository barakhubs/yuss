<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter Plan',
                'slug' => 'starter',
                'description' => 'Perfect for individuals and small teams just getting started.',
                'price' => 0, // Free
                'billing_period' => 'monthly',
                'stripe_price_id' => null, // Free plan doesn't need Stripe
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
                'features' => [
                    [
                        'name' => 'Max Users',
                        'slug' => 'max-users',
                        'type' => 'limit',
                        'value' => '3',
                        'description' => 'Maximum number of users in your organization',
                    ],
                    [
                        'name' => 'Storage Space',
                        'slug' => 'storage-space',
                        'type' => 'limit',
                        'value' => '1',
                        'description' => 'Storage space in GB',
                    ],
                    [
                        'name' => 'Email Support',
                        'slug' => 'email-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Access to email support',
                    ],
                    [
                        'name' => 'API Access',
                        'slug' => 'api-access',
                        'type' => 'boolean',
                        'value' => '0',
                        'description' => 'Access to API endpoints',
                    ],
                ],
            ],
            [
                'name' => 'Professional Plan',
                'slug' => 'professional',
                'description' => 'Ideal for growing businesses with advanced features.',
                'price' => 2999, // $29.99
                'billing_period' => 'monthly',
                'stripe_price_id' => 'price_professional_monthly', // Replace with actual Stripe price ID
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
                'features' => [
                    [
                        'name' => 'Max Users',
                        'slug' => 'max-users',
                        'type' => 'limit',
                        'value' => '25',
                        'description' => 'Maximum number of users in your organization',
                    ],
                    [
                        'name' => 'Storage Space',
                        'slug' => 'storage-space',
                        'type' => 'limit',
                        'value' => '100',
                        'description' => 'Storage space in GB',
                    ],
                    [
                        'name' => 'Email Support',
                        'slug' => 'email-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Access to email support',
                    ],
                    [
                        'name' => 'API Access',
                        'slug' => 'api-access',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Access to API endpoints',
                    ],
                    [
                        'name' => 'Priority Support',
                        'slug' => 'priority-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Priority customer support',
                    ],
                    [
                        'name' => 'API Rate Limit',
                        'slug' => 'api-rate-limit',
                        'type' => 'limit',
                        'value' => '10000',
                        'description' => 'API requests per hour',
                    ],
                ],
            ],
            [
                'name' => 'Enterprise Plan',
                'slug' => 'enterprise',
                'description' => 'For large organizations requiring unlimited access and premium support.',
                'price' => 9999, // $99.99
                'billing_period' => 'monthly',
                'stripe_price_id' => 'price_enterprise_monthly', // Replace with actual Stripe price ID
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 3,
                'features' => [
                    [
                        'name' => 'Max Users',
                        'slug' => 'max-users',
                        'type' => 'limit',
                        'value' => '-1', // Unlimited
                        'description' => 'Unlimited users in your organization',
                    ],
                    [
                        'name' => 'Storage Space',
                        'slug' => 'storage-space',
                        'type' => 'limit',
                        'value' => '-1', // Unlimited
                        'description' => 'Unlimited storage space',
                    ],
                    [
                        'name' => 'Email Support',
                        'slug' => 'email-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Access to email support',
                    ],
                    [
                        'name' => 'API Access',
                        'slug' => 'api-access',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Access to API endpoints',
                    ],
                    [
                        'name' => 'Priority Support',
                        'slug' => 'priority-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Priority customer support',
                    ],
                    [
                        'name' => 'Dedicated Support Manager',
                        'slug' => 'dedicated-support',
                        'type' => 'boolean',
                        'value' => '1',
                        'description' => 'Dedicated customer success manager',
                    ],
                    [
                        'name' => 'API Rate Limit',
                        'slug' => 'api-rate-limit',
                        'type' => 'limit',
                        'value' => '-1', // Unlimited
                        'description' => 'Unlimited API requests per hour',
                    ],
                    [
                        'name' => 'Custom Integrations',
                        'slug' => 'custom-integrations',
                        'type' => 'text',
                        'value' => 'Available on request',
                        'description' => 'Custom integrations and development support',
                    ],
                ],
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'];
            unset($planData['features']);

            $plan = Plan::create($planData);

            foreach ($features as $featureData) {
                $plan->features()->create($featureData);
            }
        }
    }
}
