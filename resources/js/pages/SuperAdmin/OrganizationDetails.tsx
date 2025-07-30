import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building, Calendar, CreditCard, Crown, DollarSign, Mail, MoreVertical, Trash2, Users } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    pivot: {
        role: string;
        created_at: string;
    };
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    status: string;
    invited_by: {
        name: string;
    };
    created_at: string;
}

interface Subscription {
    id: number;
    type: string;
    stripe_price: string;
    stripe_status: string;
    quantity: number;
    trial_ends_at?: string;
    ends_at?: string;
    created_at: string;
}

interface Organization {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    users: User[];
    invitations: Invitation[];
    subscriptions: Subscription[];
    owner: User;
}

interface SuperAdminOrganizationDetailsProps {
    organization: Organization;
}

export default function SuperAdminOrganizationDetails({ organization }: SuperAdminOrganizationDetailsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Organizations',
            href: '/super-admin/organizations',
        },
        {
            title: organization.name,
            href: `/super-admin/organizations/${organization.id}`,
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDeleteOrganization = () => {
        if (confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
            router.delete(`/super-admin/organizations/${organization.id}`);
        }
    };

    const activeSubscription = organization.subscriptions.find((sub) => sub.stripe_status === 'active' || sub.stripe_status === 'trialing');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Organization: ${organization.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/super-admin/organizations">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Building className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">{organization.name}</h1>
                            <p className="text-muted-foreground">Organization Details</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDeleteOrganization} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Organization
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Organization Info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDate(organization.created_at)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organization.users.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {activeSubscription ? (
                                    <Badge
                                        variant={activeSubscription.stripe_status === 'active' ? 'default' : 'secondary'}
                                        className="px-3 py-1 text-lg"
                                    >
                                        {activeSubscription.stripe_status === 'trialing' ? 'Trial' : 'Active'}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="px-3 py-1 text-lg">
                                        Free
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Organization Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-lg">{organization.name}</p>
                        </div>
                        {organization.description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-lg">{organization.description}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Owner</label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                    <span className="text-xs font-medium text-primary">{organization.owner.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="font-medium">{organization.owner.name}</span>
                                <span className="text-muted-foreground">({organization.owner.email})</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created</label>
                                <p>{formatDateTime(organization.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <p>{formatDateTime(organization.updated_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members */}
                <Card>
                    <CardHeader>
                        <CardTitle>Members ({organization.users.length})</CardTitle>
                        <CardDescription>Users who have access to this organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organization.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <span className="text-sm font-medium text-primary">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.pivot.role === 'owner' ? 'default' : 'secondary'}>
                                                {user.pivot.role === 'owner' && <Crown className="mr-1 h-3 w-3" />}
                                                {user.pivot.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(user.pivot.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                {organization.invitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations ({organization.invitations.length})</CardTitle>
                            <CardDescription>Users who have been invited but haven't joined yet</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Invited By</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sent</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organization.invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {invitation.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{invitation.role}</Badge>
                                            </TableCell>
                                            <TableCell>{invitation.invited_by.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {invitation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(invitation.created_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Subscriptions */}
                {organization.subscriptions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription History ({organization.subscriptions.length})</CardTitle>
                            <CardDescription>All subscription records for this organization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Trial Ends</TableHead>
                                        <TableHead>Ends At</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organization.subscriptions.map((subscription) => (
                                        <TableRow key={subscription.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="outline">{subscription.type}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={subscription.stripe_status === 'active' ? 'default' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {subscription.stripe_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{subscription.quantity}</TableCell>
                                            <TableCell>{subscription.trial_ends_at ? formatDate(subscription.trial_ends_at) : '-'}</TableCell>
                                            <TableCell>{subscription.ends_at ? formatDate(subscription.ends_at) : '-'}</TableCell>
                                            <TableCell>{formatDate(subscription.created_at)}</TableCell>
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
