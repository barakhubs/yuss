import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, CreditCard, DollarSign, User, XCircle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Quarter {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface Loan {
    id: number;
    user: User;
    quarter: Quarter;
    loan_number: string;
    amount: number;
    total_amount: number;
    outstanding_balance: number;
    status: 'pending' | 'approved' | 'disbursed' | 'completed' | 'rejected';
    purpose: string;
    applied_date: string;
    approved_date?: string;
    approved_by?: User;
    disbursed_date?: string;
    expected_repayment_date: string;
    actual_repayment_date?: string;
    repayment_period_months?: number;
}

interface LoanRepayment {
    id: number;
    amount: number;
    payment_date: string;
    notes?: string;
    created_at: string;
}

interface LoanShowProps {
    loan: Loan;
    repayments?: LoanRepayment[];
    canManage: boolean;
    defaultRepaymentAmount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Loans', href: '/sacco/loans' },
];

export default function LoanShow({ loan, repayments = [], canManage, defaultRepaymentAmount }: LoanShowProps) {
    const { post: postApprove, processing: processingApprove } = useForm();
    const {
        data: rejectData,
        setData: setRejectData,
        post: postReject,
        processing: processingReject,
    } = useForm({
        reason: '',
    });
    const { post: postDisburse, processing: processingDisburse } = useForm();
    const {
        data: repaymentData,
        setData: setRepaymentData,
        post: postRepayment,
        processing: processingRepayment,
        reset,
    } = useForm({
        amount:
            defaultRepaymentAmount && typeof defaultRepaymentAmount === 'number' && defaultRepaymentAmount > 0
                ? defaultRepaymentAmount.toFixed(2)
                : '',
        payment_method: '',
        notes: '',
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            disbursed: 'bg-green-100 text-green-800',
            repaid: 'bg-gray-100 text-gray-800',
            defaulted: 'bg-red-100 text-red-800',
            rejected: 'bg-red-100 text-red-800',
        };

        return (
            <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const handleApprove = () => {
        postApprove(route('sacco.loans.approve', loan.id));
    };

    const handleReject = () => {
        postReject(route('sacco.loans.reject', loan.id));
    };

    const handleDisburse = () => {
        postDisburse(route('sacco.loans.disburse', loan.id));
    };

    const handleRepayment = (e: React.FormEvent) => {
        e.preventDefault();
        postRepayment(route('sacco.loans.repayment', loan.id), {
            onSuccess: () => reset(),
        });
    };

    const totalRepaid = (repayments || []).reduce((sum, repayment) => sum + repayment.amount, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Loan #${loan.id} - SACCO`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sacco/loans">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Loans
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Loan #{loan.id}</h1>
                            <p className="text-muted-foreground">Applied on {formatDate(loan.applied_date)}</p>
                        </div>
                    </div>
                    {getStatusBadge(loan.status)}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Loan Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Loan Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Loan Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Borrower</Label>
                                        <p className="mt-1 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {loan.user ? `${loan.user.name} (${loan.user.email})` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Quarter</Label>
                                        <p className="mt-1 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {loan.quarter ? loan.quarter.name : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Principal Amount</Label>
                                        <p className="text-lg font-semibold">{formatEuros(loan.amount)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Interest Rate</Label>
                                        <p className="text-lg font-semibold">5%</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                                        <p className="text-lg font-semibold">{formatEuros(loan.total_amount)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Remaining Balance</Label>
                                        <p className="text-lg font-semibold text-red-600">{formatEuros(loan.outstanding_balance)}</p>
                                    </div>
                                </div>

                                {loan.purpose && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                                        <p className="mt-1 rounded-md bg-muted p-3">{loan.purpose}</p>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="border-t pt-4">
                                    <Label className="text-sm font-medium text-muted-foreground">Timeline</Label>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span>Application Date</span>
                                            <span className="font-medium">{formatDate(loan.applied_date)}</span>
                                        </div>
                                        {loan.approved_date && (
                                            <div className="flex items-center justify-between">
                                                <span>Approval Date</span>
                                                <span className="font-medium">{formatDate(loan.approved_date)}</span>
                                            </div>
                                        )}
                                        {loan.disbursed_date && (
                                            <div className="flex items-center justify-between">
                                                <span>Disbursement Date</span>
                                                <span className="font-medium">{formatDate(loan.disbursed_date)}</span>
                                            </div>
                                        )}
                                        {loan.expected_repayment_date && (
                                            <div className="flex items-center justify-between">
                                                <span>Due Date</span>
                                                <span className="font-medium">{formatDate(loan.expected_repayment_date)}</span>
                                            </div>
                                        )}
                                        {loan.repayment_period_months && (
                                            <div className="flex items-center justify-between">
                                                <span>Repayment Period</span>
                                                <span className="font-medium">
                                                    {loan.repayment_period_months} month{loan.repayment_period_months !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {loan.approved_by && (
                                    <div className="border-t pt-4">
                                        <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                                        <p className="mt-1">{loan.approved_by.name}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Repayments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Repayment History
                                </CardTitle>
                                <CardDescription>
                                    Total Repaid: {formatEuros(totalRepaid)} of {formatEuros(loan.total_amount)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(repayments || []).length > 0 ? (
                                    <div className="space-y-4">
                                        {(repayments || []).map((repayment) => (
                                            <div key={repayment.id} className="flex items-start justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">{formatEuros(repayment.amount)}</p>
                                                    <p className="text-sm text-muted-foreground">{formatDate(repayment.payment_date)}</p>
                                                    {repayment.notes && <p className="mt-1 text-sm text-muted-foreground">{repayment.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-muted-foreground">No repayments recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Admin Actions */}
                    {canManage && (
                        <div className="space-y-6">
                            {/* Loan Actions */}
                            {loan.status === 'pending' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Loan Actions</CardTitle>
                                        <CardDescription>Approve or reject this loan application</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Button onClick={handleApprove} disabled={processingApprove} className="w-full">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Loan
                                        </Button>

                                        <div className="space-y-2">
                                            <Textarea
                                                placeholder="Rejection reason (optional)"
                                                value={rejectData.reason}
                                                onChange={(e) => setRejectData('reason', e.target.value)}
                                            />
                                            <Button variant="destructive" onClick={handleReject} disabled={processingReject} className="w-full">
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Loan
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {loan.status === 'approved' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Disbursement</CardTitle>
                                        <CardDescription>Mark this loan as disbursed</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button onClick={handleDisburse} disabled={processingDisburse} className="w-full">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Mark as Disbursed
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {loan.status === 'disbursed' && loan.outstanding_balance > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Record Repayment</CardTitle>
                                        <CardDescription>Add a new repayment for this loan</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleRepayment} className="space-y-4">
                                            <div>
                                                <Label htmlFor="amount">Amount</Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    step="0.01"
                                                    max={loan.outstanding_balance}
                                                    placeholder="Enter repayment amount"
                                                    value={repaymentData.amount}
                                                    onChange={(e) => setRepaymentData('amount', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="payment_method">Payment Method (optional)</Label>
                                                <Input
                                                    id="payment_method"
                                                    type="text"
                                                    placeholder="e.g. Cash, Bank Transfer, Mobile Money"
                                                    value={repaymentData.payment_method}
                                                    onChange={(e) => setRepaymentData('payment_method', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="notes">Notes (optional)</Label>
                                                <Textarea
                                                    id="notes"
                                                    placeholder="Reference number, additional notes, etc."
                                                    value={repaymentData.notes}
                                                    onChange={(e) => setRepaymentData('notes', e.target.value)}
                                                />
                                            </div>
                                            <Button type="submit" disabled={processingRepayment} className="w-full">
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                Record Repayment
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
