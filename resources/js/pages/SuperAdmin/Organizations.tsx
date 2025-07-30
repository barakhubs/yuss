import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building, Crown, Eye, Search, Trash2, Users } from 'lucide-react';

interface Owner {
    name: string;
    email: string;
}

interface Organization {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    users_count: number;
    pending_invitations_count: number;
    owner: Owner;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: Organization[];
}

interface Filters {
    search?: string;
    status?: string;
}

interface SuperAdminOrganizationsProps {
    organizations: PaginationData;
    filters: Filters;
}

export default function SuperAdminOrganizations({ organizations, filters }: SuperAdminOrganizationsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Organizations',
            href: '/super-admin/organizations',
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleSearch = (search: string) => {
        router.get(
            '/super-admin/organizations',
            {
                ...filters,
                search,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            '/super-admin/organizations',
            {
                ...filters,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDeleteOrganization = (organization: Organization) => {
        if (confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
            router.delete(`/super-admin/organizations/${organization.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Organizations" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Manage Organizations</h1>
                            <p className="text-muted-foreground">{organizations.total} total organizations</p>
                        </div>
                    </div>
                    <Link href="/super-admin/dashboard">
                        <Button variant="outline">
                            <Crown className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter and search organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search organizations or owners..."
                                        value={filters.search || ''}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-48">
                                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Organizations</SelectItem>
                                        <SelectItem value="trial">Trial</SelectItem>
                                        <SelectItem value="active">Active Subscription</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organizations Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organizations</CardTitle>
                        <CardDescription>
                            Showing {organizations.data.length} of {organizations.total} organizations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organizations.data.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{org.name}</p>
                                                <p className="text-sm text-muted-foreground">/{org.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{org.owner.name}</p>
                                                <p className="text-sm text-muted-foreground">{org.owner.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{org.users_count}</span>
                                                {org.pending_invitations_count > 0 && (
                                                    <Badge variant="secondary">+{org.pending_invitations_count} pending</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(org.created_at)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Trial</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/super-admin/organizations/${org.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteOrganization(org)}
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

                        {organizations.data.length === 0 && (
                            <div className="py-12 text-center">
                                <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No organizations found</h3>
                                <p className="text-muted-foreground">
                                    {filters.search || filters.status ? 'Try adjusting your filters' : 'No organizations have been created yet'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {organizations.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing page {organizations.current_page} of {organizations.last_page}
                        </p>
                        <div className="flex gap-2">
                            {organizations.current_page > 1 && (
                                <Link href={`/super-admin/organizations?page=${organizations.current_page - 1}`} preserveState>
                                    <Button variant="outline">Previous</Button>
                                </Link>
                            )}
                            {organizations.current_page < organizations.last_page && (
                                <Link href={`/super-admin/organizations?page=${organizations.current_page + 1}`} preserveState>
                                    <Button variant="outline">Next</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
