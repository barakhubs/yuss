import { OrganizationAdminWarning } from '@/components/organization-admin-warning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building, Clock, Crown, Mail, Plus, Users } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    description?: string;
    users_count: number;
    pending_invitations_count: number;
    trial_ends_at?: string;
    on_trial: boolean;
    has_active_subscription: boolean;
    is_owner: boolean;
    user_role: string;
}

interface Metrics {
    total_organizations: number;
    organizations_owned: number;
    total_team_members: number;
    pending_invitations: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    can_create_organization: boolean;
}

interface DashboardProps {
    organizations: Organization[];
    metrics: Metrics;
    user: User;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ organizations, metrics, user }: DashboardProps) {
    // Check if user is an admin in any organization
    const adminOrganizations = organizations.filter((org) => org.user_role === 'admin');
    const hasAdminRole = adminOrganizations.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Welcome Section */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
                    <p className="text-muted-foreground">Here's an overview of your organizations and team activity.</p>
                </div>

                {/* Organization Admin Warning */}
                {hasAdminRole && <OrganizationAdminWarning userRole="admin" organizationCount={adminOrganizations.length} className="mb-4" />}

                {/* Metrics Cards */}
                <div className="mb-6 grid auto-rows-min gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_organizations}</div>
                            <p className="text-xs text-muted-foreground">{metrics.organizations_owned} owned by you</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_team_members}</div>
                            <p className="text-xs text-muted-foreground">Across all organizations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.pending_invitations}</div>
                            <p className="text-xs text-muted-foreground">Awaiting responses</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trial Status</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organizations.filter((org) => org.on_trial).length}</div>
                            <p className="text-xs text-muted-foreground">Organizations on trial</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Organizations Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Your Organizations</h2>
                        {organizations.length === 0 && (
                            <Link href="/organizations/create">
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Organization
                                </Button>
                            </Link>
                        )}
                    </div>

                    {organizations.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No organizations yet</h3>
                                <p className="mb-6 text-muted-foreground">Create your first organization to get started.</p>
                                <Link href="/organizations/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Organization
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {organizations.map((org) => (
                                <Card key={org.id} className="transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            {org.name}
                                            {org.is_owner && <Crown className="h-4 w-4 text-yellow-500" />}
                                        </CardTitle>
                                        <CardDescription>{org.description || 'No description'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Role:</span>
                                                <span className="capitalize">{org.user_role}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Members:</span>
                                                <span>{org.users_count}</span>
                                            </div>
                                            {org.on_trial && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Trial ends:</span>
                                                    <span className="text-orange-600">{new Date(org.trial_ends_at!).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span className={org.has_active_subscription ? 'text-green-600' : 'text-orange-600'}>
                                                    {org.has_active_subscription ? 'Active' : 'Trial'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Link href={`/organizations/${org.slug}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    View
                                                </Button>
                                            </Link>
                                            {org.is_owner && (
                                                <Link href={`/organizations/${org.slug}/subscriptions`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        Billing
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks to manage your organizations and teams.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-3">
                            <Link href="/organizations">
                                <Button variant="outline" className="w-full justify-start">
                                    <Building className="mr-2 h-4 w-4" />
                                    Manage Organizations
                                </Button>
                            </Link>
                            {organizations.length === 0 && (
                                <Link href="/organizations/create">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Organization
                                    </Button>
                                </Link>
                            )}
                            <Link href="/settings">
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="mr-2 h-4 w-4" />
                                    Account Settings
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
