import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, Eye, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface Organization {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface SaccoYear {
    id: number;
    year: number;
}

interface Loan {
    id: number;
    loan_number: string;
    principal_amount: number;
    interest_rate: number;
    total_amount: number;
    outstanding_balance: number;
    status: string;
    purpose: string;
    applied_date: string;
    approved_date?: string;
    disbursed_date?: string;
    user: User;
    approved_by?: User;
    sacco_year: SaccoYear;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: Loan[];
}

interface Filters {
    status?: string;
    search?: string;
}

interface LoansIndexProps {
    organization: Organization;
    loans: PaginationData;
    isAdmin: boolean;
    filters: Filters;
    statuses: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Loans', href: '/sacco/loans' },
];

export default function LoansIndex({ organization, loans, isAdmin, filters, statuses }: LoansIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'outline' as const, label: 'Pending', color: 'text-orange-600' },
            approved: { variant: 'default' as const, label: 'Approved', color: 'text-blue-600' },
            disbursed: { variant: 'secondary' as const, label: 'Active', color: 'text-green-600' },
            repaid: { variant: 'default' as const, label: 'Repaid', color: 'text-gray-600' },
            rejected: { variant: 'destructive' as const, label: 'Rejected', color: 'text-red-600' },
            defaulted: { variant: 'destructive' as const, label: 'Defaulted', color: 'text-red-600' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            variant: 'outline' as const,
            label: status,
            color: 'text-gray-600',
        };

        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const handleSearch = () => {
        router.get(
            '/sacco/loans',
            {
                ...filters,
                search: searchTerm,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            '/sacco/loans',
            {
                ...filters,
                status: status === 'all' ? '' : status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Loans - ${organization.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Loans</h1>
                            <p className="text-muted-foreground">{isAdmin ? 'Manage all loans' : 'Your loan applications and history'}</p>
                        </div>
                    </div>

                    <Link href="/sacco/loans/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Apply for Loan
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex flex-1 gap-2">
                                <Input
                                    placeholder="Search loans by number, purpose, or borrower..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                    className="max-w-sm"
                                />
                                <Button onClick={handleSearch} variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="w-48">
                                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {Object.entries(statuses).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loans Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loan Applications</CardTitle>
                        <CardDescription>
                            Showing {loans.data.length} of {loans.total} loans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loan Details</TableHead>
                                    {isAdmin && <TableHead>Borrower</TableHead>}
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loans.data.map((loan) => (
                                    <TableRow key={loan.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{loan.loan_number}</p>
                                                <p className="max-w-48 truncate text-sm text-muted-foreground">{loan.purpose}</p>
                                            </div>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{loan.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{loan.user.email}</p>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{formatCurrency(loan.principal_amount)}</p>
                                                <p className="text-sm text-muted-foreground">Total: {formatCurrency(loan.total_amount)}</p>
                                                {loan.status === 'disbursed' && loan.outstanding_balance > 0 && (
                                                    <p className="text-sm text-red-600">Outstanding: {formatCurrency(loan.outstanding_balance)}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p>{formatDate(loan.applied_date)}</p>
                                                {loan.approved_date && (
                                                    <p className="text-sm text-muted-foreground">Approved: {formatDate(loan.approved_date)}</p>
                                                )}
                                                {loan.disbursed_date && (
                                                    <p className="text-sm text-muted-foreground">Disbursed: {formatDate(loan.disbursed_date)}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/sacco/loans/${loan.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {loans.data.length === 0 && (
                            <div className="py-12 text-center">
                                <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No loans found</h3>
                                <p className="text-muted-foreground">
                                    {filters.search || filters.status ? 'Try adjusting your filters' : 'Apply for your first loan to get started'}
                                </p>
                                {!filters.search && !filters.status && (
                                    <Link href="/sacco/loans/create" className="mt-4 inline-block">
                                        <Button>Apply for Loan</Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {loans.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing page {loans.current_page} of {loans.last_page}
                        </p>
                        <div className="flex gap-2">
                            {loans.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.get('/sacco/loans', {
                                            ...filters,
                                            page: loans.current_page - 1,
                                        })
                                    }
                                >
                                    Previous
                                </Button>
                            )}
                            {loans.current_page < loans.last_page && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.get('/sacco/loans', {
                                            ...filters,
                                            page: loans.current_page + 1,
                                        })
                                    }
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
