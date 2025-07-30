<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanFeature;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    /**
     * Display a listing of plans.
     */
    public function index()
    {
        $plans = Plan::with('features')
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(function ($plan) {
                $plan->features_count = $plan->features->count();
                return $plan;
            });

        return inertia('SuperAdmin/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new plan.
     */
    public function create()
    {
        return Inertia::render('SuperAdmin/Plans/Create');
    }

    /**
     * Store a newly created plan.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_period' => ['required', 'in:monthly,yearly'],
            'stripe_price_id' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'features' => ['array'],
            'features.*.name' => ['required', 'string'],
            'features.*.key' => ['required', 'string'],
            'features.*.value' => ['required', 'string'],
            'features.*.type' => ['required', 'in:limit,boolean,text'],
            'features.*.description' => ['nullable', 'string'],
        ]);

        $plan = Plan::create($request->only([
            'name',
            'description',
            'price',
            'billing_period',
            'stripe_price_id',
            'is_active',
            'is_featured',
            'sort_order',
        ]));

        // Create features
        if ($request->has('features')) {
            foreach ($request->features as $index => $featureData) {
                $plan->features()->create([
                    'name' => $featureData['name'],
                    'slug' => $featureData['slug'],
                    'value' => $featureData['value'],
                    'type' => $featureData['type'],
                    'description' => $featureData['description'] ?? null,
                ]);
            }
        }

        return redirect()->route('super-admin.plans.show', $plan)
            ->with('success', 'Plan created successfully!');
    }

    /**
     * Display the specified plan.
     */
    public function show(Plan $plan)
    {
        $plan->load('features');

        return Inertia::render('SuperAdmin/Plans/Show', [
            'plan' => $plan,
        ]);
    }

    /**
     * Show the form for editing the specified plan.
     */
    public function edit(Plan $plan)
    {
        $plan->load('features');

        return Inertia::render('SuperAdmin/Plans/Edit', [
            'plan' => $plan,
        ]);
    }

    /**
     * Update the specified plan.
     */
    public function update(Request $request, Plan $plan)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_period' => ['required', 'in:monthly,yearly'],
            'stripe_price_id' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'features' => ['array'],
            'features.*.id' => ['nullable', 'integer'],
            'features.*.name' => ['required', 'string'],
            'features.*.key' => ['required', 'string'],
            'features.*.value' => ['required', 'string'],
            'features.*.type' => ['required', 'in:limit,boolean,text'],
            'features.*.description' => ['nullable', 'string'],
        ]);

        $plan->update($request->only([
            'name',
            'description',
            'price',
            'billing_period',
            'stripe_price_id',
            'is_active',
            'is_featured',
            'sort_order',
        ]));

        // Update features
        if ($request->has('features')) {
            $existingFeatureIds = collect($request->features)
                ->pluck('id')
                ->filter()
                ->values();

            // Delete features that are no longer present
            $plan->features()->whereNotIn('id', $existingFeatureIds)->delete();

            // Update or create features
            foreach ($request->features as $index => $featureData) {
                if (isset($featureData['id'])) {
                    // Update existing feature
                    $plan->features()->where('id', $featureData['id'])->update([
                        'name' => $featureData['name'],
                        'slug' => $featureData['slug'],
                        'value' => $featureData['value'],
                        'type' => $featureData['type'],
                        'description' => $featureData['description'] ?? null,
                    ]);
                } else {
                    // Create new feature
                    $plan->features()->create([
                        'name' => $featureData['name'],
                        'slug' => $featureData['slug'],
                        'value' => $featureData['value'],
                        'type' => $featureData['type'],
                        'description' => $featureData['description'] ?? null,
                    ]);
                }
            }
        }

        return redirect()->route('super-admin.plans.show', $plan)
            ->with('success', 'Plan updated successfully!');
    }

    /**
     * Remove the specified plan.
     */
    public function destroy(Plan $plan)
    {
        $planName = $plan->name;
        $plan->delete();

        return redirect()->route('super-admin.plans.index')
            ->with('success', "Plan '{$planName}' deleted successfully!");
    }
}
