import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    trial_ends_at?: string;
    on_trial: boolean;
    has_active_subscription: boolean;
}

interface Subscription {
    id: string;
    stripe_id: string;
    stripe_status: string;
    stripe_price?: string;
    quantity: number;
    trial_ends_at?: string;
    ends_at?: string;
    created_at: string;
    updated_at: string;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    stripe_price_id: string;
    popular?: boolean;
}

interface SubscriptionsIndexProps {
    organization: Organization;
    subscription?: Subscription;
    plans: Plan[];
    billing_portal_url?: string;
}

export default function SubscriptionsIndex({ organization, subscription, plans, billing_portal_url }: SubscriptionsIndexProps) {
    // Check for success/error messages from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

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
    ];

    const handleSubscribe = (priceId: string) => {
        router.post(`/organizations/${organization.slug}/subscriptions`, {
            price_id: priceId,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { variant: 'default' as const, label: 'Active' },
            trialing: { variant: 'secondary' as const, label: 'Trial' },
            past_due: { variant: 'destructive' as const, label: 'Past Due' },
            canceled: { variant: 'outline' as const, label: 'Canceled' },
            unpaid: { variant: 'destructive' as const, label: 'Unpaid' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            variant: 'outline' as const,
            label: status.charAt(0).toUpperCase() + status.slice(1),
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Billing - ${organization.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Billing & Subscriptions</h1>
                        <p className="text-muted-foreground">Manage your subscription and billing for {organization.name}</p>
                    </div>
                    {billing_portal_url && (
                        <a href={billing_portal_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Billing Portal
                            </Button>
                        </a>
                    )}
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-800">
                                    <strong>Subscription successful!</strong> Welcome to your new plan.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {canceled && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <p className="text-sm text-orange-800">Subscription canceled. You can try again anytime.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Current Subscription Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Current Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subscription ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Status</span>
                                    {getStatusBadge(subscription.stripe_status)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Plan</span>
                                    <span>{subscription.stripe_price || 'Unknown Plan'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Quantity</span>
                                    <span>{subscription.quantity}</span>
                                </div>
                                {subscription.trial_ends_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Trial Ends</span>
                                        <span className="text-orange-600">{formatDate(subscription.trial_ends_at)}</span>
                                    </div>
                                )}
                                {subscription.ends_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Ends At</span>
                                        <span className="text-red-600">{formatDate(subscription.ends_at)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Created</span>
                                    <span>{formatDate(subscription.created_at)}</span>
                                </div>
                            </div>
                        ) : organization.on_trial ? (
                            <div className="py-8 text-center">
                                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-orange-500" />
                                <h3 className="mb-2 text-lg font-medium">Trial Period</h3>
                                <p className="mb-4 text-muted-foreground">
                                    Your trial {organization.trial_ends_at ? `ends on ${formatDate(organization.trial_ends_at)}` : 'is active'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Choose a plan below to continue using our service after your trial ends.
                                </p>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No Active Subscription</h3>
                                <p className="text-muted-foreground">Choose a plan below to get started.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Available Plans */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {plan.name}
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">${plan.price}</div>
                                            <div className="text-sm text-muted-foreground">/{plan.interval}</div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="mb-6 space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="w-full"
                                        variant={plan.popular ? 'default' : 'outline'}
                                        onClick={() => handleSubscribe(plan.stripe_price_id)}
                                        disabled={
                                            subscription &&
                                            subscription.stripe_status === 'active' &&
                                            subscription.stripe_price === plan.stripe_price_id
                                        }
                                    >
                                        {subscription && subscription.stripe_status === 'active' && subscription.stripe_price === plan.stripe_price_id
                                            ? 'Current Plan'
                                            : 'Subscribe'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Billing Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Billing Information
                        </CardTitle>
                        <CardDescription>Manage your payment methods and billing details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                You can update your payment methods, download invoices, and view billing history through the Stripe Customer Portal.
                            </p>
                            {billing_portal_url && (
                                <a href={billing_portal_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Manage Billing
                                    </Button>
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
