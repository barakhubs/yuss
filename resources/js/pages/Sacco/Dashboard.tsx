import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Banknote, CheckCircle2, CreditCard, DollarSign, PiggyBank, TrendingUp, Users, Wallet } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
}

interface SaccoYear {
    id: number;
    year: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface SaccoQuarter {
    id: number;
    quarter_number: number;
    start_date: string;
    end_date: string;
    is_completed: boolean;
}

interface Metrics {
    total_savings: number;
    available_savings: number;
    total_interest_earnings: number;
    active_loans: number;
    committee_role?: string;
}

interface AdminMetrics {
    pending_loans: number;
    total_unpaid_loans: number;
    total_members: number;
    committee_members: number;
}

interface Loan {
    id: number;
    loan_number: string;
    principal_amount: number;
    total_amount: number;
    outstanding_balance: number;
    status: string;
    applied_date: string;
    approved_by?: { name: string };
}

interface Saving {
    id: number;
    amount: number;
    shared_out: boolean;
    created_at: string;
    sacco_quarter: {
        quarter_number: number;
        sacco_year: {
            year: number;
        };
    };
}

interface DashboardProps {
    organization: Organization;
    currentYear?: SaccoYear;
    currentQuarter?: SaccoQuarter;
    userRole: string;
    isAdmin: boolean;
    metrics: Metrics;
    adminMetrics?: AdminMetrics;
    recentLoans: Loan[];
    recentSavings: Saving[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'SACCO', href: '/sacco' }];

export default function SaccoDashboard({
    organization,
    currentYear,
    currentQuarter,
    userRole,
    isAdmin,
    metrics,
    adminMetrics,
    recentLoans,
    recentSavings,
}: DashboardProps) {
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
            pending: { variant: 'outline' as const, label: 'Pending' },
            approved: { variant: 'default' as const, label: 'Approved' },
            disbursed: { variant: 'secondary' as const, label: 'Active' },
            repaid: { variant: 'default' as const, label: 'Repaid' },
            rejected: { variant: 'destructive' as const, label: 'Rejected' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            variant: 'outline' as const,
            label: status,
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`SACCO Dashboard - ${organization.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PiggyBank className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">{organization.name}</h1>
                            <p className="text-muted-foreground">
                                SACCO Year {currentYear?.year || 'Not Set'}
                                {currentQuarter && ` • Quarter ${currentQuarter.quarter_number}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/sacco/savings/create">
                            <Button>
                                <Wallet className="mr-2 h-4 w-4" />
                                Add Savings
                            </Button>
                        </Link>
                        <Link href="/sacco/loans/create">
                            <Button variant="outline">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Apply for Loan
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Member Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.total_savings)}</div>
                            <p className="text-xs text-muted-foreground">Available: {formatCurrency(metrics.available_savings)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Interest Earnings</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.total_interest_earnings)}</div>
                            <p className="text-xs text-muted-foreground">From loan returns & year-end shares</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.active_loans}</div>
                            <p className="text-xs text-muted-foreground">Unpaid loans</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Role</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{userRole}</div>
                            {metrics.committee_role && <p className="text-xs text-muted-foreground">Committee: {metrics.committee_role}</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Metrics */}
                {isAdmin && adminMetrics && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminMetrics.pending_loans}</div>
                                <p className="text-xs text-muted-foreground">Awaiting approval</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unpaid Loans</CardTitle>
                                <DollarSign className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminMetrics.total_unpaid_loans}</div>
                                <p className="text-xs text-muted-foreground">Active disbursed loans</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminMetrics.total_members}</div>
                                <p className="text-xs text-muted-foreground">Organization members</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Committee</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminMetrics.committee_members}/4</div>
                                <p className="text-xs text-muted-foreground">Committee positions filled</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Loans */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Loans</CardTitle>
                                <CardDescription>Your latest loan applications</CardDescription>
                            </div>
                            <Link href="/sacco/loans">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentLoans.length > 0 ? (
                                <div className="space-y-4">
                                    {recentLoans.map((loan) => (
                                        <div key={loan.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                                            <div>
                                                <p className="font-medium">{loan.loan_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(loan.principal_amount)} • Applied {formatDate(loan.applied_date)}
                                                </p>
                                            </div>
                                            {getStatusBadge(loan.status)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">No loans yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Savings */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Savings</CardTitle>
                                <CardDescription>Your latest savings contributions</CardDescription>
                            </div>
                            <Link href="/sacco/savings">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentSavings.length > 0 ? (
                                <div className="space-y-4">
                                    {recentSavings.map((saving) => (
                                        <div key={saving.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                                            <div>
                                                <p className="font-medium">{formatCurrency(saving.amount)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Q{saving.sacco_quarter.quarter_number} {saving.sacco_quarter.sacco_year.year}
                                                </p>
                                            </div>
                                            <Badge variant={saving.shared_out ? 'default' : 'secondary'}>
                                                {saving.shared_out ? 'Shared Out' : 'Active'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">No savings yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions for Admins */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Quick Actions</CardTitle>
                            <CardDescription>Administrative functions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/sacco/loans?status=pending">
                                    <Button variant="outline" size="sm">
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Review Pending Loans
                                    </Button>
                                </Link>
                                <Link href="/sacco/committee">
                                    <Button variant="outline" size="sm">
                                        <Users className="mr-2 h-4 w-4" />
                                        Manage Committee
                                    </Button>
                                </Link>
                                <Link href="/sacco/savings/summary">
                                    <Button variant="outline" size="sm">
                                        <Banknote className="mr-2 h-4 w-4" />
                                        Savings Summary
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
