import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Info } from 'lucide-react';
import React from 'react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface RepaymentPeriod {
    months: number;
    label: string;
    repayment_date: string;
    repayment_month: string;
}

interface LoansCreateProps {
    currentQuarter: Quarter;
    availableRepaymentPeriods: RepaymentPeriod[];
    maxRepaymentMonths: number;
    quarterEndDate: string;
    userSavingsBalance: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Loans', href: '/sacco/loans' },
    { title: 'Apply', href: '/sacco/loans/create' },
];

export default function LoansCreate({
    currentQuarter,
    availableRepaymentPeriods,
    maxRepaymentMonths,
    quarterEndDate,
    userSavingsBalance,
}: LoansCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        purpose: '',
        repayment_period_months: '',
    });

    const calculateTotalWithInterest = (principal: number) => {
        const interest = principal * 0.05; // 5% interest
        return principal + interest;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sacco/loans');
    };

    const selectedPeriod = availableRepaymentPeriods.find((period) => period.months.toString() === data.repayment_period_months);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apply for Loan - SACCO" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/sacco/loans">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Apply for Loan</h1>
                            <p className="text-muted-foreground">
                                Submit your loan application for Q{currentQuarter.quarter_number} {currentQuarter.year}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Application Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Application</CardTitle>
                                <CardDescription>
                                    Fill out the details for your loan request. All loans have a fixed 5% interest rate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <Label htmlFor="amount">Loan Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="Enter amount in EUR"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className={errors.amount ? 'border-red-500' : ''}
                                        />
                                        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="purpose">Purpose of Loan</Label>
                                        <Textarea
                                            id="purpose"
                                            placeholder="Describe what you need the loan for..."
                                            value={data.purpose}
                                            onChange={(e) => setData('purpose', e.target.value)}
                                            className={errors.purpose ? 'border-red-500' : ''}
                                            rows={4}
                                        />
                                        {errors.purpose && <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="repayment_period_months">Repayment Period</Label>
                                        <Select
                                            value={data.repayment_period_months}
                                            onValueChange={(value) => setData('repayment_period_months', value)}
                                        >
                                            <SelectTrigger className={errors.repayment_period_months ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select repayment period..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRepaymentPeriods.map((period) => (
                                                    <SelectItem key={period.months} value={period.months.toString()}>
                                                        {period.label} (Due: {period.repayment_month})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.repayment_period_months && (
                                            <p className="mt-1 text-sm text-red-500">{errors.repayment_period_months}</p>
                                        )}
                                        {selectedPeriod && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Expected repayment date: {new Date(selectedPeriod.repayment_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button type="submit" disabled={processing} className="flex-1">
                                            {processing ? 'Submitting...' : 'Submit Application'}
                                        </Button>
                                        <Link href="/sacco/loans">
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary & Info */}
                    <div className="space-y-6">
                        {/* Quarter Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Quarter Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Current Quarter:</span>
                                        <span className="font-medium">
                                            Q{currentQuarter.quarter_number} {currentQuarter.year}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Quarter End:</span>
                                        <span className="font-medium">{quarterEndDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Max Repayment Period:</span>
                                        <span className="font-medium">
                                            {maxRepaymentMonths} month{maxRepaymentMonths !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                                    <p>Loan repayment must be completed within the current quarter timeframe.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loan Calculator */}
                        {data.amount && !isNaN(parseFloat(data.amount)) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span>Principal Amount:</span>
                                        <span className="font-medium">{formatEuros(parseFloat(data.amount))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Interest (5%):</span>
                                        <span className="font-medium">{formatEuros(parseFloat(data.amount) * 0.05)}</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between font-bold">
                                            <span>Total to Repay:</span>
                                            <span>{formatEuros(calculateTotalWithInterest(parseFloat(data.amount)))}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Your Savings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Savings</CardTitle>
                                <CardDescription>Available savings balance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{formatEuros(userSavingsBalance)}</p>
                                <p className="mt-1 text-sm text-muted-foreground">Savings not shared out</p>
                            </CardContent>
                        </Card>

                        {/* Loan Terms */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <strong>Interest Rate:</strong>
                                    <p className="text-muted-foreground">Fixed 5% on principal amount</p>
                                </div>
                                <div>
                                    <strong>Interest Distribution:</strong>
                                    <p className="text-muted-foreground">
                                        50% returned to you when loan is repaid
                                        <br />
                                        50% distributed at year-end among committee and members
                                    </p>
                                </div>
                                <div>
                                    <strong>Approval Process:</strong>
                                    <p className="text-muted-foreground">Applications are reviewed by SACCO administrators</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
