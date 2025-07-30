import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, DollarSign, Package, Pencil, X } from 'lucide-react';

interface PlanFeature {
    id: number;
    name: string;
    slug: string;
    type: 'boolean' | 'limit' | 'text';
    value: string;
    formatted_value: string;
    description?: string;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price: number;
    formatted_price: string;
    billing_period: string;
    billing_period_text: string;
    stripe_price_id?: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    features: PlanFeature[];
    created_at: string;
    updated_at: string;
}

interface SuperAdminPlanShowProps {
    plan: Plan;
}

export default function SuperAdminPlanShow({ plan }: SuperAdminPlanShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Plans',
            href: '/super-admin/plans',
        },
        {
            title: plan.name,
            href: `/super-admin/plans/${plan.id}`,
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderFeatureValue = (feature: PlanFeature) => {
        switch (feature.type) {
            case 'boolean':
                return feature.value === '1' ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />;
            case 'limit':
                return <span className="font-mono text-sm">{feature.value === '-1' ? 'Unlimited' : feature.value}</span>;
            case 'text':
                return <span className="text-sm">{feature.value}</span>;
            default:
                return <span className="text-sm">{feature.value}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Plan: ${plan.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{plan.name}</h1>
                                {plan.is_featured && <Badge variant="default">Featured</Badge>}
                                <Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            {plan.description && <p className="text-muted-foreground">{plan.description}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/super-admin/plans">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Plans
                            </Button>
                        </Link>
                        <Link href={`/super-admin/plans/${plan.id}/edit`}>
                            <Button>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Plan
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Plan Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Information</CardTitle>
                                <CardDescription>Basic details about this subscription plan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Plan Name</label>
                                        <p className="text-lg font-semibold">{plan.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Slug</label>
                                        <p className="rounded bg-muted px-2 py-1 font-mono text-sm">{plan.slug}</p>
                                    </div>
                                </div>

                                {plan.description && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="mt-1">{plan.description}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Price</label>
                                        <p className="text-2xl font-bold text-green-600">{plan.formatted_price}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Billing Period</label>
                                        <p className="text-lg capitalize">{plan.billing_period}</p>
                                    </div>
                                </div>

                                {plan.stripe_price_id && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Stripe Price ID</label>
                                        <p className="rounded bg-muted px-2 py-1 font-mono text-sm">{plan.stripe_price_id}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                                    <p className="text-lg">{plan.sort_order}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Features</CardTitle>
                                <CardDescription>Features and limitations included in this plan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {plan.features.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-medium">No features defined</h3>
                                        <p className="text-muted-foreground">Add features to define what's included in this plan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {plan.features.map((feature) => (
                                            <div key={feature.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <h4 className="font-medium">{feature.name}</h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            {feature.type}
                                                        </Badge>
                                                    </div>
                                                    {feature.description && <p className="text-sm text-muted-foreground">{feature.description}</p>}
                                                    <p className="mt-1 font-mono text-xs text-muted-foreground">{feature.slug}</p>
                                                </div>
                                                <div className="flex items-center">{renderFeatureValue(feature)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Featured:</span>
                                    <Badge variant={plan.is_featured ? 'default' : 'outline'}>{plan.is_featured ? 'Yes' : 'No'}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Features:</span>
                                    <span className="font-medium">{plan.features.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sort Order:</span>
                                    <span className="font-medium">{plan.sort_order}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timestamps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">{formatDate(plan.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                    <p className="text-sm">{formatDate(plan.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
