import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, PiggyBank, Plus, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

import { formatEuros } from '@/lib/currency';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface Saving {
    id: number;
    user: User;
    quarter: Quarter;
    amount: number;
    shared_out: boolean;
    shared_out_at?: string;
    created_at: string;
    updated_at: string;
}

interface SavingsStats {
    total_savings: number;
    monthly_target: number;
    quarterly_target: number;
    quarter_saved: number;
    target_completion: number;
}

interface SavingsIndexProps {
    savings: {
        data: Saving[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: SavingsStats;
    currentTarget?: {
        id: number;
        monthly_target: number;
    };
    monthsSaved?: {
        [month: string]: Saving[];
    };
    quarters: Quarter[];
    hasSetTarget: boolean;
    isAdmin: boolean;
    filters?: {
        search?: string;
        quarter?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
];

export default function SavingsIndex({ savings, stats, quarters, hasSetTarget, isAdmin, filters = {} }: SavingsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedQuarter, setSelectedQuarter] = useState(filters.quarter || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedQuarter('all');
        setSelectedStatus('all');
        router.get('/sacco/savings');
    };

    // Remove useCallback and useEffect, replace with direct debounced effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Only make request if there are actual filters to apply
            const hasFilters = searchTerm || (selectedQuarter && selectedQuarter !== 'all') || (selectedStatus && selectedStatus !== 'all');

            if (hasFilters) {
                const params = new URLSearchParams();
                if (searchTerm) params.set('search', searchTerm);
                if (selectedQuarter && selectedQuarter !== 'all') params.set('quarter', selectedQuarter);
                if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

                router.get('/sacco/savings?' + params.toString());
            } else {
                // If no filters, only navigate if we're not already on the base URL
                const currentUrl = new URL(window.location.href);
                if (currentUrl.search) {
                    router.get('/sacco/savings');
                }
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedQuarter, selectedStatus]); // Direct dependencies

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Savings - SACCO" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Savings Management</h1>
                        <p className="text-muted-foreground">Member savings contributions and quarter management</p>
                    </div>

                    <div className="flex gap-2">
                        {hasSetTarget ? (
                            <>
                                <Link href="/sacco/savings/share-out">
                                    <Button variant="outline">
                                        <PiggyBank className="mr-2 h-4 w-4" />
                                        Share-Out Management
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            !isAdmin && (
                                <Link href="/sacco/savings/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Set Savings Target
                                    </Button>
                                </Link>
                            )
                        )}
                        {!isAdmin && (
                            <Link href="/sacco/savings/create">
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Savings Target
                                </Button>
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/sacco/savings/create">
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Make Savings
                                </Button>
                            </Link>
                        )}
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
                            <div className="text-2xl font-bold">{formatEuros(stats.total_savings)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatEuros(stats.monthly_target)}</div>
                            <p className="text-xs text-muted-foreground">Quarterly: {formatEuros(stats.quarterly_target)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quarter Saved</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatEuros(stats.quarter_saved)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Progress</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.target_completion}%</div>
                            <p className="text-xs text-muted-foreground">
                                {formatEuros(stats.quarter_saved)} of {formatEuros(stats.quarterly_target)}
                            </p>
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
                                />
                            </div>
                            <div className="min-w-[150px]">
                                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Quarters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Quarters</SelectItem>
                                        {quarters.map((quarter) => (
                                            <SelectItem key={quarter.id} value={quarter.id.toString()}>
                                                Q{quarter.quarter_number} {quarter.year}
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
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="shared_out">Shared Out</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleClearFilters}
                                disabled={!searchTerm && selectedQuarter === 'all' && selectedStatus === 'all'}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear
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
                                            Q{saving.quarter.quarter_number} {saving.quarter.year}
                                        </TableCell>
                                        <TableCell className="font-medium">{formatEuros(saving.amount)}</TableCell>
                                        <TableCell>{formatDate(saving.created_at)}</TableCell>
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
