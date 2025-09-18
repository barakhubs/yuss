import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CreditCard, DollarSign, Eye, LogIn, Search, Shield, Trash2, UserCheck, Users, UserX, Wallet } from 'lucide-react';
import { useState } from 'react';

interface Member {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    role_display: string;
    is_verified: boolean;
    created_by_admin: boolean;
    can_be_impersonated: boolean;
    status_display: string;
    joined_date: string;
    last_login: string;
    total_savings: number;
    current_quarter_savings: number;
    current_quarter_target: number | null;
    has_active_loan: boolean;
    total_loans_amount: number;
    active_loan_balance: number;
    savings_count: number;
    loans_count: number;
}

interface Statistics {
    total_members: number;
    total_savings: number;
    total_active_loans: number;
    total_loan_balance: number;
    committee_members: number; // Count of admins (chairpersons)
    pending_invitations: number;
}

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    name: string;
    status: string;
}

interface Filters {
    search: string;
    status: string;
    role: string;
    [key: string]: string;
}

interface PaginatedMembers {
    data: Member[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface MembersIndexProps {
    members: PaginatedMembers;
    filters: Filters;
    statistics: Statistics;
    currentQuarter: Quarter | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SACCO Dashboard',
        href: '/sacco',
    },
    {
        title: 'Member Management',
        href: '/sacco/members',
    },
];

export default function MembersIndex({ members, filters, statistics, currentQuarter }: MembersIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const [localFilters, setLocalFilters] = useState(filters);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Member | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debug: Log user role to console
    console.log('Current user role:', auth.user.role);
    console.log('Auth user:', auth.user);
    console.log('Members data:', members.data.slice(0, 2)); // Log first 2 members

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDeleteUser = (user: Member) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
        setConfirmDelete(false);
    };

    const confirmDeleteUser = () => {
        if (!userToDelete || !confirmDelete) return;

        setIsDeleting(true);
        router.delete(route('sacco.members.destroy', userToDelete.id), {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setUserToDelete(null);
                setConfirmDelete(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                alert('Error deleting user: ' + (errors.message || 'Unknown error occurred'));
                setIsDeleting(false);
            },
        });
    };

    const handleActivateUser = (user: Member) => {
        router.patch(
            route('sacco.members.activate', user.id),
            {},
            {
                onSuccess: () => {
                    // Page will refresh automatically
                },
                onError: (errors) => {
                    alert('Error activating user: ' + (errors.message || 'Unknown error occurred'));
                },
            },
        );
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setUserToDelete(null);
        setConfirmDelete(false);
    };

    const buildQueryString = (filters: Filters, page?: number) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.append(key, value);
            }
        });
        if (page) {
            params.append('page', page.toString());
        }
        return params.toString();
    };

    const handleSearch = () => {
        router.get('/sacco/members', localFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);

        // Auto-apply non-search filters
        if (key !== 'search') {
            router.get('/sacco/members', newFilters, {
                preserveState: true,
                replace: true,
            });
        }
    };

    const getStatusBadge = (member: Member) => {
        if (!member.is_verified) {
            return (
                <Badge variant="secondary">
                    <UserX className="mr-1 h-3 w-3" />
                    Inactive
                </Badge>
            );
        }
        return (
            <Badge variant="default">
                <UserCheck className="mr-1 h-3 w-3" />
                Active
            </Badge>
        );
    };

    const getRoleBadge = (role: string) => {
        const roleColors: Record<string, string> = {
            chairperson: 'bg-purple-100 text-purple-800 border-purple-300',
            secretary: 'bg-blue-100 text-blue-800 border-blue-300',
            treasurer: 'bg-green-100 text-green-800 border-green-300',
            disburser: 'bg-orange-100 text-orange-800 border-orange-300',
            member: 'bg-gray-100 text-gray-800 border-gray-300',
        };

        const colorClass = roleColors[role] || roleColors.member;

        return (
            <Badge variant="outline" className={colorClass}>
                {role === 'chairperson' && <Shield className="mr-1 h-3 w-3" />}
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
        );
    };

    const getTargetProgress = (member: Member) => {
        if (!member.current_quarter_target || member.current_quarter_target === 0) {
            return null;
        }

        const progress = (member.current_quarter_savings / member.current_quarter_target) * 100;
        const progressCapped = Math.min(progress, 100);

        return (
            <div className="flex items-center gap-2">
                <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                        className={`h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${progressCapped}%` }}
                    />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Member Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Member Management</h1>
                            <p className="text-muted-foreground">
                                {statistics.total_members} active members
                                {currentQuarter && ` • ${currentQuarter.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/sacco/members/create">
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Create User
                            </Button>
                        </Link>
                        <Link href="/invitations/create">
                            <Button>
                                <Users className="mr-2 h-4 w-4" />
                                Invite Member
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_members}</div>
                            <p className="text-xs text-muted-foreground">{statistics.pending_invitations} pending invitations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(statistics.total_savings)}</div>
                            <p className="text-xs text-muted-foreground">Across all quarters</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_active_loans}</div>
                            <p className="text-xs text-muted-foreground">{formatCurrency(statistics.total_loan_balance)} outstanding</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admins</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.committee_members}</div>
                            <p className="text-xs text-muted-foreground">Active administrators</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filter</CardTitle>
                        <CardDescription>Find members by name, email, status, or role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={localFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={handleSearch} variant="outline">
                                Search
                            </Button>
                            <Select value={localFilters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={localFilters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="secretary">Secretary</SelectItem>
                                    <SelectItem value="treasurer">Treasurer</SelectItem>
                                    <SelectItem value="disburser">Disburser</SelectItem>
                                    <SelectItem value="chairperson">Chairperson</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Members Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Members</CardTitle>
                        <CardDescription>
                            Showing {members.from} to {members.to} of {members.total} members
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Savings</TableHead>
                                    <TableHead>Quarter Progress</TableHead>
                                    <TableHead>Loans</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.data.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <span className="text-sm font-medium text-primary">{member.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                                        <TableCell>{getStatusBadge(member)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="font-medium">{formatCurrency(member.total_savings)}</div>
                                                <div className="text-muted-foreground">{member.savings_count} deposits</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {currentQuarter ? (
                                                <div className="text-sm">
                                                    <div className="font-medium">
                                                        {formatCurrency(member.current_quarter_savings)}
                                                        {member.current_quarter_target && (
                                                            <span className="text-muted-foreground">
                                                                /{formatCurrency(member.current_quarter_target)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {getTargetProgress(member)}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No active quarter</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="font-medium">{member.loans_count} loans</div>
                                                {member.has_active_loan && (
                                                    <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-700">
                                                        <DollarSign className="mr-1 h-3 w-3" />
                                                        {formatCurrency(member.active_loan_balance)} due
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{member.joined_date}</div>
                                                <div className="text-muted-foreground">Last: {member.last_login}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/sacco/members/${member.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                {/* Activation button for inactive users */}
                                                {auth.user.role === 'chairperson' && !member.is_verified && (
                                                    <Button
                                                        onClick={() => handleActivateUser(member)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-green-200 text-green-700 hover:bg-green-50"
                                                        title={`Activate ${member.name}`}
                                                    >
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Activate
                                                    </Button>
                                                )}
                                                {/* Impersonation button for verified members */}
                                                {auth.user.role === 'chairperson' && member.can_be_impersonated && (
                                                    <Button
                                                        onClick={() => {
                                                            router.post(route('sacco.members.impersonate', member.id));
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        title={`Impersonate ${member.name}`}
                                                    >
                                                        <LogIn className="mr-2 h-4 w-4" />
                                                        Impersonate
                                                    </Button>
                                                )}
                                                {/* Delete button for super admins only */}
                                                {auth.user.is_super_admin && member.id !== auth.user.id && (
                                                    <Button
                                                        onClick={() => handleDeleteUser(member)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                                        title={`Delete ${member.name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {members.data.length === 0 && (
                            <div className="py-12 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No members found</h3>
                                <p className="text-muted-foreground">
                                    {filters.search || filters.status !== 'all' || filters.role !== 'all'
                                        ? 'Try adjusting your search filters'
                                        : 'No members have been added yet'}
                                </p>
                                {!filters.search && filters.status === 'all' && filters.role === 'all' && (
                                    <Link href="/invitations/create" className="mt-4 inline-block">
                                        <Button>
                                            <Users className="mr-2 h-4 w-4" />
                                            Invite First Member
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Pagination */}
                {members.last_page > 1 && (
                    <Pagination
                        currentPage={members.current_page}
                        lastPage={members.last_page}
                        total={members.total}
                        perPage={members.per_page}
                        from={members.from}
                        to={members.to}
                        buildUrl={(page) => `/sacco/members?${buildQueryString(localFilters, page)}`}
                        href="/sacco/members"
                        preserveState={true}
                        onPageChange={() => {}} // Not used when buildUrl is provided
                    />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="confirm-delete"
                                checked={confirmDelete}
                                onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
                            />
                            <Label
                                htmlFor="confirm-delete"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I understand this action cannot be undone
                            </Label>
                        </div>

                        {userToDelete?.has_active_loan && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Warning:</strong> This user has an active loan of {formatCurrency(userToDelete.active_loan_balance)}.
                                    Deleting this user will not affect the loan records.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteUser} disabled={!confirmDelete || isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
