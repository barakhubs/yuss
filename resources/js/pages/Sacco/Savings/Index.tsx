import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, PiggyBank, Plus, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SaccoQuarter {
    id: number;
    quarter: number;
    sacco_year: {
        year: number;
    };
}

interface MemberSaving {
    id: number;
    user: User;
    sacco_quarter: SaccoQuarter;
    amount: number;
    transaction_date: string;
    shared_out: boolean;
    created_at: string;
    updated_at: string;
}

interface SavingsSummary {
    total_savings: number;
    current_quarter_savings: number;
    members_with_savings: number;
    average_savings_per_member: number;
    quarters_with_savings: Array<{
        quarter: number;
        year: number;
        total: number;
        members: number;
    }>;
}

interface SavingsIndexProps {
    savings: {
        data: MemberSaving[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: SavingsSummary;
    filters?: {
        search?: string;
        quarter?: string;
        status?: string;
    };
    isAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
];

export default function SavingsIndex({ savings, summary, filters = {}, isAdmin }: SavingsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedQuarter, setSelectedQuarter] = useState(filters.quarter || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedQuarter) params.set('quarter', selectedQuarter);
        if (selectedStatus) params.set('status', selectedStatus);

        router.get('/sacco/savings?' + params.toString());
    };

    const handleShareOut = () => {
        if (confirm('Are you sure you want to perform quarter share-out? This action cannot be undone.')) {
            router.post('/sacco/savings/share-out');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Savings - SACCO" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Savings Management</h1>
                        <p className="text-muted-foreground">Member savings contributions and quarter management</p>
                    </div>

                    <div className="flex gap-2">
                        {isAdmin && (
                            <>
                                <Link href="/sacco/savings/summary">
                                    <Button variant="outline">
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Summary Report
                                    </Button>
                                </Link>
                                <Button onClick={handleShareOut} variant="secondary">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Quarter Share-out
                                </Button>
                            </>
                        )}
                        <Link href="/sacco/savings/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Savings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_savings)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Quarter</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.current_quarter_savings)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.members_with_savings}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average per Member</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.average_savings_per_member)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by member name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="min-w-[150px]">
                                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Quarters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Quarters</SelectItem>
                                        {summary.quarters_with_savings.map((quarter) => (
                                            <SelectItem key={`${quarter.year}-${quarter.quarter}`} value={`${quarter.year}-${quarter.quarter}`}>
                                                Q{quarter.quarter} {quarter.year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[120px]">
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="shared_out">Shared Out</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Savings Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Savings Records</CardTitle>
                        <CardDescription>
                            Showing {savings.data.length} of {savings.total} savings records
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Quarter</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savings.data.map((saving) => (
                                    <TableRow key={saving.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{saving.user.name}</div>
                                                <div className="text-sm text-muted-foreground">{saving.user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            Q{saving.sacco_quarter.quarter} {saving.sacco_quarter.sacco_year.year}
                                        </TableCell>
                                        <TableCell className="font-medium">{formatCurrency(saving.amount)}</TableCell>
                                        <TableCell>{formatDate(saving.transaction_date)}</TableCell>
                                        <TableCell>
                                            <Badge variant={saving.shared_out ? 'secondary' : 'default'}>
                                                {saving.shared_out ? 'Shared Out' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {savings.data.length === 0 && (
                            <div className="py-8 text-center">
                                <PiggyBank className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium text-muted-foreground">No Savings Found</h3>
                                <p className="mb-4 text-muted-foreground">
                                    {filters?.search || filters?.quarter || filters?.status
                                        ? 'No savings match your current filters.'
                                        : 'No savings have been recorded yet.'}
                                </p>
                                <Link href="/sacco/savings/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add First Savings
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Pagination */}
                        {savings.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(savings.current_page - 1) * savings.per_page + 1} to{' '}
                                    {Math.min(savings.current_page * savings.per_page, savings.total)} of {savings.total} results
                                </div>
                                <div className="flex gap-2">
                                    {savings.current_page > 1 && (
                                        <Link href={`/sacco/savings?page=${savings.current_page - 1}`} preserveState>
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}
                                    {savings.current_page < savings.last_page && (
                                        <Link href={`/sacco/savings?page=${savings.current_page + 1}`} preserveState>
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
