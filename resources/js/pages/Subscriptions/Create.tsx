import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, CreditCard, Star } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    stripe_price_id: string;
    popular?: boolean;
    description?: string;
}

interface SubscriptionsCreateProps {
    organization: Organization;
    plans: Plan[];
    selected_plan?: string;
}

export default function SubscriptionsCreate({ organization, plans, selected_plan }: SubscriptionsCreateProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Organizations',
            href: '/organizations',
        },
        {
            title: organization.name,
            href: `/organizations/${organization.slug}`,
        },
        {
            title: 'Billing',
            href: `/organizations/${organization.slug}/subscriptions`,
        },
        {
            title: 'Choose Plan',
            href: `/organizations/${organization.slug}/subscriptions/create`,
        },
    ];

    const handleSelectPlan = (priceId: string) => {
        router.post(`/organizations/${organization.slug}/subscriptions`, {
            price_id: priceId,
        });
    };

    const handleGoBack = () => {
        router.visit(`/organizations/${organization.slug}/subscriptions`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Choose Plan - ${organization.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Choose Your Plan</h1>
                        <p className="text-muted-foreground">Select the perfect plan for {organization.name}</p>
                    </div>
                    <Button variant="outline" onClick={handleGoBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Billing
                    </Button>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative transition-all hover:shadow-lg ${plan.popular ? 'scale-105 ring-2 ring-primary' : ''} ${
                                selected_plan === plan.stripe_price_id ? 'ring-2 ring-blue-500' : ''
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                                    <Badge className="flex items-center gap-1 bg-primary text-primary-foreground">
                                        <Star className="h-3 w-3" />
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-4 text-center">
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <CardDescription className="mb-4">
                                    {plan.description || `Perfect for ${plan.name.toLowerCase()} usage`}
                                </CardDescription>
                                <div className="space-y-1">
                                    <div className="text-4xl font-bold">
                                        ${plan.price}
                                        <span className="text-base font-normal text-muted-foreground">/{plan.interval}</span>
                                    </div>
                                    {plan.price > 0 && <p className="text-sm text-muted-foreground">Billed {plan.interval}ly</p>}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Features List */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                            <span className="text-sm leading-5">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Select Button */}
                                <Button
                                    className="w-full"
                                    variant={plan.popular ? 'default' : 'outline'}
                                    size="lg"
                                    onClick={() => handleSelectPlan(plan.stripe_price_id)}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {plan.price === 0 ? 'Start Free Trial' : `Subscribe to ${plan.name}`}
                                </Button>

                                {/* Additional Info */}
                                {plan.price > 0 && (
                                    <div className="pt-2 text-center">
                                        <p className="text-xs text-muted-foreground">14-day free trial included</p>
                                        <p className="text-xs text-muted-foreground">Cancel anytime</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Benefits Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Why Choose Our Platform?</CardTitle>
                        <CardDescription>Join thousands of teams already using our platform to collaborate better</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <CheckCircle className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="mb-2 font-semibold">Easy Setup</h3>
                                <p className="text-sm text-muted-foreground">Get started in minutes with our simple onboarding process</p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                    <CreditCard className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="mb-2 font-semibold">Secure Payments</h3>
                                <p className="text-sm text-muted-foreground">Your payment information is protected with bank-level security</p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                    <Star className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="mb-2 font-semibold">24/7 Support</h3>
                                <p className="text-sm text-muted-foreground">Our team is here to help you succeed every step of the way</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="mb-1 font-medium">Can I change my plan later?</h4>
                            <p className="text-sm text-muted-foreground">
                                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-1 font-medium">What happens during the free trial?</h4>
                            <p className="text-sm text-muted-foreground">
                                You get full access to all features for 14 days. No payment required upfront.
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-1 font-medium">Can I cancel anytime?</h4>
                            <p className="text-sm text-muted-foreground">
                                Absolutely. You can cancel your subscription at any time with no cancellation fees.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
