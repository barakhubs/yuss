import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Eye, Package, Pencil, Plus, Trash2 } from 'lucide-react';

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
    features_count: number;
    created_at: string;
    updated_at: string;
}

interface SuperAdminPlansIndexProps {
    plans: Plan[];
}

export default function SuperAdminPlansIndex({ plans }: SuperAdminPlansIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Plans',
            href: '/super-admin/plans',
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDeletePlan = (plan: Plan) => {
        if (confirm(`Are you sure you want to delete the "${plan.name}" plan? This action cannot be undone.`)) {
            router.delete(`/super-admin/plans/${plan.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Plans" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Subscription Plans</h1>
                            <p className="text-muted-foreground">{plans.length} total plans</p>
                        </div>
                    </div>
                    <Link href="/super-admin/plans/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Plan
                        </Button>
                    </Link>
                </div>

                {/* Plans Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{plans.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{plans.filter((p) => p.is_active).length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Featured Plans</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{plans.filter((p) => p.is_featured).length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Plans Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Plans</CardTitle>
                        <CardDescription>Manage subscription plans and their features</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {plans.length === 0 ? (
                            <div className="py-12 text-center">
                                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No plans yet</h3>
                                <p className="mb-6 text-muted-foreground">Create your first subscription plan to get started.</p>
                                <Link href="/super-admin/plans/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Plan
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Features</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{plan.name}</p>
                                                        {plan.is_featured && (
                                                            <Badge variant="default" className="text-xs">
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-lg">{plan.formatted_price}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {plan.billing_period}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{plan.features_count} features</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                                    {plan.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(plan.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/super-admin/plans/${plan.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/super-admin/plans/${plan.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeletePlan(plan)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
