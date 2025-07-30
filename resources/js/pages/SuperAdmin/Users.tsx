import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Crown, Search, Shield, Users } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    email_verified_at?: string;
    created_at: string;
    organizations_count: number;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: User[];
}

interface Filters {
    search?: string;
}

interface SuperAdminUsersProps {
    users: PaginationData;
    filters: Filters;
}

export default function SuperAdminUsers({ users, filters }: SuperAdminUsersProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Users',
            href: '/super-admin/users',
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
            '/super-admin/users',
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

    const handleToggleSuperAdmin = (user: User) => {
        if (user.organizations_count > 0 && !user.is_super_admin) {
            // User has organizations, offer force promotion
            if (
                confirm(
                    `${user.name} belongs to ${user.organizations_count} organization(s). ` +
                        `Making them a super admin will remove them from all organizations and transfer/delete owned organizations. ` +
                        `Do you want to proceed?`,
                )
            ) {
                router.post(`/super-admin/users/${user.id}/force-promote`);
            }
        } else {
            // Standard toggle
            const action = user.is_super_admin ? 'remove' : 'grant';
            if (confirm(`Are you sure you want to ${action} super admin privileges for ${user.name}?`)) {
                router.post(`/super-admin/users/${user.id}/toggle-super-admin`);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Manage Users</h1>
                            <p className="text-muted-foreground">{users.total} total users</p>
                        </div>
                    </div>
                    <Link href="/super-admin/dashboard">
                        <Button variant="outline">
                            <Crown className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Users</CardTitle>
                        <CardDescription>Find users by name or email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                value={filters.search || ''}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>
                            Showing {users.data.length} of {users.total} users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Organizations</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
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
                                            {user.email_verified_at ? (
                                                <Badge variant="default">Verified</Badge>
                                            ) : (
                                                <Badge variant="secondary">Unverified</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{user.organizations_count}</span>
                                                {user.organizations_count > 0 && !user.is_super_admin && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Has orgs
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(user.created_at)}</TableCell>
                                        <TableCell>
                                            {user.is_super_admin ? (
                                                <Badge variant="default" className="border-yellow-300 bg-yellow-100 text-yellow-800">
                                                    <Crown className="mr-1 h-3 w-3" />
                                                    Super Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">User</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleSuperAdmin(user)}
                                                className={
                                                    user.is_super_admin
                                                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                                        : user.organizations_count > 0
                                                          ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                                          : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                                                }
                                            >
                                                <Shield className="mr-2 h-4 w-4" />
                                                {user.is_super_admin ? 'Remove Admin' : user.organizations_count > 0 ? 'Force Promote' : 'Make Admin'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {users.data.length === 0 && (
                            <div className="py-12 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No users found</h3>
                                <p className="text-muted-foreground">
                                    {filters.search ? 'Try adjusting your search' : 'No users have been registered yet'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing page {users.current_page} of {users.last_page}
                        </p>
                        <div className="flex gap-2">
                            {users.current_page > 1 && (
                                <Link href={`/super-admin/users?page=${users.current_page - 1}`} preserveState>
                                    <Button variant="outline">Previous</Button>
                                </Link>
                            )}
                            {users.current_page < users.last_page && (
                                <Link href={`/super-admin/users?page=${users.current_page + 1}`} preserveState>
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
