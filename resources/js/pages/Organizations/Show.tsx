import { OrganizationAdminWarning } from '@/components/organization-admin-warning';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building, Calendar, CheckCircle, Clock, Crown, Mail, Plus, Settings, Trash2, Users, X } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        role: string;
        joined_at: string;
    };
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    expires_at: string;
    created_at: string;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    price: number;
    billing_period: string;
}

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
    created_at: string;
    plan?: Plan;
}

interface OrganizationShowProps {
    organization: Organization;
    users: User[];
    invitations: Invitation[];
    can_manage: boolean;
}

export default function OrganizationShow({ organization, users = [], invitations = [], can_manage }: OrganizationShowProps) {
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
    ];

    const handleRemoveUser = (userId: number) => {
        if (confirm('Are you sure you want to remove this user from the organization?')) {
            router.delete(`/organizations/${organization.slug}/users`, {
                data: { user_id: userId },
            });
        }
    };

    const handleCancelInvitation = (invitationId: number) => {
        if (confirm('Are you sure you want to cancel this invitation?')) {
            router.delete(`/invitations/${invitationId}`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleBadge = (role: string) => {
        const roleConfig = {
            owner: { variant: 'default' as const, label: 'Owner' },
            admin: { variant: 'secondary' as const, label: 'Admin' },
            member: { variant: 'outline' as const, label: 'Member' },
        };

        const config = roleConfig[role as keyof typeof roleConfig] || {
            variant: 'outline' as const,
            label: role.charAt(0).toUpperCase() + role.slice(1),
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={organization.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{organization.name}</h1>
                                {organization.is_owner && <Crown className="h-5 w-5 text-yellow-500" />}
                            </div>
                            <p className="text-muted-foreground">{organization.description || 'No description'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {can_manage && (
                            <>
                                <Link href={`/organizations/${organization.slug}/edit`}>
                                    <Button variant="outline">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Button>
                                </Link>
                                <Link href={`/organizations/${organization.slug}/subscriptions`}>
                                    <Button variant="outline">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Billing
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Organization Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-2">
                                    <p className="text-sm leading-none font-medium">Members</p>
                                    <p className="text-2xl font-bold">{organization.users_count}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-2">
                                    <p className="text-sm leading-none font-medium">Pending Invites</p>
                                    <p className="text-2xl font-bold">{organization.pending_invitations_count}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-2">
                                    <p className="text-sm leading-none font-medium">Created</p>
                                    <p className="text-sm font-medium">{formatDate(organization.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-2">
                                    <p className="text-sm leading-none font-medium">Status</p>
                                    <p
                                        className={`text-sm font-medium ${organization.has_active_subscription ? 'text-green-600' : 'text-orange-600'}`}
                                    >
                                        {organization.has_active_subscription ? 'Active' : 'Trial'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Crown className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-2">
                                    <p className="text-sm leading-none font-medium">Current Plan</p>
                                    <p className="text-sm font-medium">
                                        {organization.plan ? (
                                            <>
                                                {organization.plan.name}
                                                {organization.plan.price > 0 && (
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        - ${(organization.plan.price / 100).toFixed(2)}/
                                                        {organization.plan.billing_period === 'monthly' ? 'mo' : 'yr'}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            'No plan selected'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Trial Warning */}
                {organization.on_trial && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <p className="text-sm text-orange-800">
                                    <strong>
                                        Trial ends {organization.trial_ends_at ? `on ${formatDate(organization.trial_ends_at)}` : 'soon'}.
                                    </strong>{' '}
                                    Subscribe to continue using this organization.
                                </p>
                                <Link href={`/organizations/${organization.slug}/subscriptions`} className="ml-auto">
                                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                                        Subscribe Now
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Organization Admin Warning */}
                <OrganizationAdminWarning userRole={organization.user_role} organizationCount={1} />

                {/* Members Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members ({users.length})
                                </CardTitle>
                                <CardDescription>Manage your organization members and their roles</CardDescription>
                            </div>
                            {can_manage && (
                                <Link href={`/organizations/${organization.slug}/invitations/create`}>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Invite Member
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    {can_manage && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                                                    ) : (
                                                        <span className="text-sm font-medium text-primary">{user.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(user.pivot.role)}</TableCell>
                                        <TableCell>{formatDate(user.pivot.joined_at)}</TableCell>
                                        {can_manage && (
                                            <TableCell className="text-right">
                                                {user.pivot.role !== 'owner' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveUser(user.id)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Pending Invitations ({invitations.length})
                            </CardTitle>
                            <CardDescription>Users who have been invited but haven't joined yet</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Invited</TableHead>
                                        <TableHead>Expires</TableHead>
                                        {can_manage && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell className="font-medium">{invitation.email}</TableCell>
                                            <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                                            <TableCell>{formatDate(invitation.created_at)}</TableCell>
                                            <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                                            {can_manage && (
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancelInvitation(invitation.id)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
