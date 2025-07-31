<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\PlanFeature;
use App\Models\Organization;
use Illuminate\Console\Command;

class SetupPaddleDemo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'paddle:setup-demo';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up demo data for Paddle integration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up Paddle demo data...');

        // Update the plans with proper Paddle price IDs
        $this->updatePlans();

        // Reset any organization's plan to test the subscription flow
        $this->resetOrganizationPlan();

        $this->info('Paddle demo setup complete!');
        $this->info('');
        $this->info('Next steps:');
        $this->info('1. Sign up for a Paddle account at https://paddle.com');
        $this->info('2. Get your Paddle credentials from your dashboard');
        $this->info('3. Update your .env file with the Paddle credentials');
        $this->info('4. Create products and prices in your Paddle dashboard that match:');
        $this->info('   - Professional Plan: pri_professional_monthly');
        $this->info('   - Enterprise Plan: pri_enterprise_monthly');
        $this->info('5. Test the free plan subscription (Starter Plan)');
        $this->info('6. Test paid plan subscriptions with sandbox data');
    }

    /**
     * Update plans with example Paddle price IDs.
     */
    private function updatePlans()
    {
        $plans = [
            'starter' => ['paddle_price_id' => null], // Free plan
            'professional' => ['paddle_price_id' => 'pri_professional_monthly'],
            'enterprise' => ['paddle_price_id' => 'pri_enterprise_monthly'],
        ];

        foreach ($plans as $slug => $data) {
            $plan = Plan::where('slug', $slug)->first();
            if ($plan) {
                $plan->update($data);
                $this->info("Updated {$plan->name} with Paddle price ID: " . ($data['paddle_price_id'] ?? 'FREE'));
            }
        }
    }

    /**
     * Reset organization's plan to test subscription flow.
     */
    private function resetOrganizationPlan()
    {
        $organization = Organization::first();
        if ($organization) {
            $organization->update(['plan_id' => null]);
            $this->info("Reset {$organization->name} plan to allow testing subscription flow");
        }
    }
}
