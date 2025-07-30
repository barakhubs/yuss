import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building, Crown, DollarSign, Mail, Package, TrendingUp, Users } from 'lucide-react';

interface Metrics {
    total_users: number;
    total_organizations: number;
    total_subscriptions: number;
    total_revenue: number;
    trial_organizations: number;
    pending_invitations: number;
}

interface Organization {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    owner: {
        name: string;
        email: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    created_at: string;
}

interface SuperAdminDashboardProps {
    metrics: Metrics;
    recent_organizations: Organization[];
    recent_users: User[];
}

export default function SuperAdminDashboard({ metrics, recent_organizations, recent_users }: SuperAdminDashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Dashboard',
            href: '/super-admin/dashboard',
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    <div>
                        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage all organizations and users</p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold">{metrics.total_users}</p>
                                </div>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                                    <p className="text-2xl font-bold">{metrics.total_organizations}</p>
                                </div>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                                    <p className="text-2xl font-bold">{metrics.total_subscriptions}</p>
                                </div>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</p>
                                </div>
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Trial Organizations</p>
                                    <p className="text-2xl font-bold">{metrics.trial_organizations}</p>
                                </div>
                                <Building className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                                    <p className="text-2xl font-bold">{metrics.pending_invitations}</p>
                                </div>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-4">
                            <Link href="/super-admin/organizations">
                                <Button variant="outline" className="w-full justify-start">
                                    <Building className="mr-2 h-4 w-4" />
                                    Manage Organizations
                                </Button>
                            </Link>
                            <Link href="/super-admin/users">
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Users
                                </Button>
                            </Link>
                            <Link href="/super-admin/plans">
                                <Button variant="outline" className="w-full justify-start">
                                    <Package className="mr-2 h-4 w-4" />
                                    Manage Plans
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="outline" className="w-full justify-start">
                                    <Crown className="mr-2 h-4 w-4" />
                                    User Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Organizations */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Organizations</CardTitle>
                                <Link href="/super-admin/organizations">
                                    <Button variant="outline" size="sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                            <CardDescription>Latest organizations created</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recent_organizations.map((org) => (
                                <div key={org.id} className="flex items-center justify-between">
                                    <div>
                                        <Link href={`/super-admin/organizations/${org.id}`} className="font-medium hover:underline">
                                            {org.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            by {org.owner.name} • {formatDate(org.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recent_organizations.length === 0 && <p className="py-4 text-center text-muted-foreground">No organizations yet</p>}
                        </CardContent>
                    </Card>

                    {/* Recent Users */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Users</CardTitle>
                                <Link href="/super-admin/users">
                                    <Button variant="outline" size="sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                            <CardDescription>Latest user registrations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recent_users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{user.name}</span>
                                            {user.is_super_admin && (
                                                <Badge variant="default">
                                                    <Crown className="mr-1 h-3 w-3" />
                                                    Super Admin
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email} • {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recent_users.length === 0 && <p className="py-4 text-center text-muted-foreground">No users yet</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
