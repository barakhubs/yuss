import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, CreditCard, DollarSign, Eye, TrendingUp, Users, Wallet, XCircle } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    savings_category: 'A' | 'B' | 'C' | null;
    is_verified: boolean;
    created_at: string;
    last_login_at: string | null;
    savings_targets: SavingsTarget[];
    savings: Saving[];
    loans: Loan[];
    shareout_decisions: ShareoutDecision[];
}

interface SavingsTarget {
    id: number;
    monthly_target: number;
    quarter: Quarter;
}

interface Saving {
    id: number;
    amount: number;
    saved_on: string;
    created_at: string;
    quarter: Quarter;
    notes?: string;
}

interface Loan {
    id: number;
    amount: number;
    total_amount: number;
    outstanding_balance: number;
    amount_paid: number;
    status: string;
    applied_date: string;
    approved_date: string | null;
    disbursed_date: string | null;
    completed_at: string | null;
    loan_number: string;
    purpose: string;
}

interface ShareoutDecision {
    id: number;
    wants_shareout: boolean;
    amount_to_shareout: number;
    created_at: string;
    quarter: Quarter;
}

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    name: string;
    status: string;
}

interface QuarterSavingsSummary {
    quarter: Quarter;
    total_amount: number;
    months_count: number;
    average_monthly: number;
}

interface LoanSummary {
    total_loans: number;
    total_amount_borrowed: number;
    total_amount_repaid: number;
    current_balance: number;
    completed_loans: number;
    active_loans: number;
}

interface MemberShowProps {
    member: Member;
    savingsByQuarter: QuarterSavingsSummary[];
    loanSummary: LoanSummary;
}

export default function MemberShow({ member, savingsByQuarter, loanSummary }: MemberShowProps) {
    const { data, setData, patch, processing } = useForm({
        savings_category: member.savings_category || '',
    });

    const handleCategoryUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('sacco.members.update-category', member.id));
    };

    const getCategoryInfo = (category: 'A' | 'B' | 'C' | null) => {
        if (!category) return null;

        const categoryData = {
            A: { monthly: 500, welfare: 1500, loans: '€2,000 - €7,500' },
            B: { monthly: 300, welfare: 1250, loans: '€1,000 - €5,000' },
            C: { monthly: 100, welfare: 750, loans: '€300 - €500' },
        };

        return categoryData[category];
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'SACCO Dashboard',
            href: '/sacco',
        },
        {
            title: 'Member Management',
            href: '/sacco/members',
        },
        {
            title: member.name,
            href: `/sacco/members/${member.id}`,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            approved: { icon: CheckCircle, class: 'bg-blue-100 text-blue-800 border-blue-300' },
            disbursed: { icon: DollarSign, class: 'bg-green-100 text-green-800 border-green-300' },
            completed: { icon: CheckCircle, class: 'bg-gray-100 text-gray-800 border-gray-300' },
            rejected: { icon: XCircle, class: 'bg-red-100 text-red-800 border-red-300' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge variant="outline" className={config.class}>
                <Icon className="mr-1 h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
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

        return (
            <Badge variant="outline" className={roleColors[role] || roleColors.member}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${member.name} - Member Details`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sacco/members">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Members
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-lg font-medium text-primary">{member.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{member.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{member.email}</span>
                                    {getRoleBadge(member.role)}
                                    <Badge variant={member.is_verified ? 'default' : 'secondary'}>{member.is_verified ? 'Active' : 'Inactive'}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(member.savings.reduce((sum, saving) => sum + saving.amount, 0))}</div>
                            <p className="text-xs text-muted-foreground">{member.savings.length} deposits made</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Loan Balance</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(loanSummary.current_balance)}</div>
                            <p className="text-xs text-muted-foreground">{loanSummary.active_loans} active loans</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(loanSummary.total_amount_borrowed)}</div>
                            <p className="text-xs text-muted-foreground">{loanSummary.total_loans} total loans</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDate(member.created_at)}</div>
                            <p className="text-xs text-muted-foreground">
                                Last login: {member.last_login_at ? formatDate(member.last_login_at) : 'Never'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Savings Category Assignment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Savings Category
                        </CardTitle>
                        <CardDescription>Assign member to a savings category (A, B, or C)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCategoryUpdate} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Category</label>
                                    {member.savings_category ? (
                                        <div className="space-y-2">
                                            <Badge variant="outline" className="px-3 py-1 text-lg">
                                                Category {member.savings_category}
                                            </Badge>
                                            {getCategoryInfo(member.savings_category) && (
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    <div>
                                                        <span className="font-medium">Monthly Savings:</span> €
                                                        {getCategoryInfo(member.savings_category)!.monthly}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Welfare Payout:</span> €
                                                        {getCategoryInfo(member.savings_category)!.welfare}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Loan Range:</span>{' '}
                                                        {getCategoryInfo(member.savings_category)!.loans}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                            <p className="text-sm text-yellow-800">No category assigned</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assign New Category</label>
                                    <div className="flex gap-2">
                                        <Select value={data.savings_category} onValueChange={(value) => setData('savings_category', value)}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A">Category A (€500/month)</SelectItem>
                                                <SelectItem value="B">Category B (€300/month)</SelectItem>
                                                <SelectItem value="C">Category C (€100/month)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button type="submit" disabled={processing || !data.savings_category}>
                                            {processing ? 'Updating...' : 'Update'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Members must have a category assigned before they can set savings targets or apply for loans.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h4 className="mb-2 text-sm font-semibold">Category Overview</h4>
                                <div className="grid gap-3 text-xs md:grid-cols-3">
                                    <div className="space-y-1">
                                        <div className="font-semibold">Category A</div>
                                        <div>Monthly: €500</div>
                                        <div>Welfare: €1,500</div>
                                        <div>Loans: €2,000 - €7,500</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-semibold">Category B</div>
                                        <div>Monthly: €300</div>
                                        <div>Welfare: €1,250</div>
                                        <div>Loans: €1,000 - €5,000</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-semibold">Category C</div>
                                        <div>Monthly: €100</div>
                                        <div>Welfare: €750</div>
                                        <div>Loans: €300 - €500</div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Savings by Quarter */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Savings by Quarter
                            </CardTitle>
                            <CardDescription>Quarterly savings performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {savingsByQuarter.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Quarter</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Months</TableHead>
                                            <TableHead>Avg/Month</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {savingsByQuarter.map((quarterData) => (
                                            <TableRow key={quarterData.quarter.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{quarterData.quarter.name}</div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {quarterData.quarter.status}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{formatCurrency(quarterData.total_amount)}</TableCell>
                                                <TableCell>{quarterData.months_count}</TableCell>
                                                <TableCell>{formatCurrency(quarterData.average_monthly)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">No savings recorded yet</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Savings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Recent Savings
                            </CardTitle>
                            <CardDescription>Latest savings deposits</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {member.savings.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Quarter</TableHead>
                                            <TableHead>Saved On</TableHead>
                                            <TableHead>Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {member.savings
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .slice(0, 10)
                                            .map((saving) => (
                                                <TableRow key={saving.id}>
                                                    <TableCell>{formatDate(saving.created_at)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {saving.quarter.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatDate(saving.saved_on)}</TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(saving.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">No savings deposits yet</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Loan History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Loan History
                        </CardTitle>
                        <CardDescription>All loan applications and their status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {member.loans.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applied</TableHead>
                                        <TableHead>Loan Number</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Amount Paid</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {member.loans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>{formatDate(loan.applied_date)}</TableCell>
                                            <TableCell className="font-mono text-sm">{loan.loan_number}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                                            <TableCell>{formatCurrency(loan.total_amount)}</TableCell>
                                            <TableCell>{formatCurrency(loan.amount_paid)}</TableCell>
                                            <TableCell>
                                                <span className={loan.outstanding_balance > 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}>
                                                    {formatCurrency(loan.outstanding_balance)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                            <TableCell>
                                                <Link href={`/sacco/loans/${loan.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No loan applications yet</div>
                        )}
                    </CardContent>
                </Card>

                {/* Savings Targets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Savings Targets
                        </CardTitle>
                        <CardDescription>Quarterly savings targets set by member</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {member.savings_targets.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quarter</TableHead>
                                        <TableHead>Monthly Target</TableHead>
                                        <TableHead>Quarterly Target</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {member.savings_targets.map((target) => {
                                        const quarterSavings = savingsByQuarter.find((qs) => qs.quarter.id === target.quarter.id);
                                        const quarterlyTarget = target.monthly_target * 3;
                                        const actualSavings = quarterSavings?.total_amount || 0;
                                        const progressPercent = quarterlyTarget > 0 ? (actualSavings / quarterlyTarget) * 100 : 0;

                                        return (
                                            <TableRow key={target.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{target.quarter.name}</div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {target.quarter.status}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{formatCurrency(target.monthly_target)}</TableCell>
                                                <TableCell>{formatCurrency(quarterlyTarget)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-16 rounded-full bg-gray-200">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    progressPercent >= 100
                                                                        ? 'bg-green-500'
                                                                        : progressPercent >= 75
                                                                          ? 'bg-blue-500'
                                                                          : progressPercent >= 50
                                                                            ? 'bg-yellow-500'
                                                                            : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
                                                        <span className="text-xs text-muted-foreground">({formatCurrency(actualSavings)})</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No savings targets set yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
