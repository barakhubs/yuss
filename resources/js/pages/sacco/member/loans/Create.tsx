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

interface LoanType {
    label: string;
    min: number;
    max: number;
    interest_rate: number;
    max_repayment_months: number;
    description: string;
}

interface LoansCreateProps {
    currentQuarter: Quarter;
    availableRepaymentPeriods: RepaymentPeriod[];
    maxRepaymentMonths: number;
    quarterEndDate: string;
    userSavingsBalance: number;
    loanTypes: Record<string, LoanType>;
    userCategory: 'A' | 'B' | 'C' | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Loans', href: '/sacco/loans' },
    { title: 'Apply', href: '/sacco/loan/create' },
];

export default function LoansCreate({
    currentQuarter,
    availableRepaymentPeriods,
    maxRepaymentMonths,
    quarterEndDate,
    userSavingsBalance,
    loanTypes,
    userCategory,
}: LoansCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        purpose: '',
        repayment_period_months: '',
        loan_type: '',
    });

    const selectedLoanType = data.loan_type ? loanTypes[data.loan_type] : null;

    // Filter repayment periods based on selected loan type's max repayment months
    const filteredRepaymentPeriods = selectedLoanType
        ? availableRepaymentPeriods.filter((period) => period.months <= selectedLoanType.max_repayment_months)
        : availableRepaymentPeriods;

    const calculateTotalWithInterest = (principal: number) => {
        if (!selectedLoanType) return principal;
        const interestRate = selectedLoanType.interest_rate / 100;
        const interest = principal * interestRate;
        return principal + interest;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sacco/loans');
    };

    const selectedPeriod = filteredRepaymentPeriods.find((period) => period.months.toString() === data.repayment_period_months);

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
                                <CardDescription>Fill out the details for your loan request. Interest rates vary by loan type.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {!userCategory && (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>No Category Assigned:</strong> You need a savings category assigned before applying for a
                                                loan. Please contact the administrator.
                                            </p>
                                        </div>
                                    )}

                                    {userCategory && Object.keys(loanTypes).length === 0 && (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>No Loan Types Available:</strong> There are no loan types available for you at this time.
                                                {userCategory === 'A' || userCategory === 'B' ? (
                                                    <span className="mt-1 block">
                                                        Main Savings Loans are available from February for Category {userCategory} members.
                                                    </span>
                                                ) : (
                                                    <span className="mt-1 block">
                                                        Some loan types may only be available during specific months or when you don't have active
                                                        loans.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {Object.keys(loanTypes).length > 0 && (
                                        <div>
                                            <Label htmlFor="loan_type">Loan Type</Label>
                                            <Select
                                                value={data.loan_type}
                                                onValueChange={(value) => {
                                                    setData('loan_type', value);
                                                    // Reset repayment period when loan type changes
                                                    setData('repayment_period_months', '');
                                                }}
                                            >
                                                <SelectTrigger className={errors.loan_type ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select loan type..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(loanTypes).map(([key, type]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.loan_type && <p className="mt-1 text-sm text-red-500">{errors.loan_type}</p>}
                                            {selectedLoanType && <p className="mt-1 text-sm text-muted-foreground">{selectedLoanType.description}</p>}
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="amount">Loan Amount</Label>
                                        {selectedLoanType && (
                                            <p className="mb-1 text-xs text-muted-foreground">
                                                Range: {formatEuros(selectedLoanType.min)} - {formatEuros(selectedLoanType.max)}
                                            </p>
                                        )}
                                        <Input
                                            id="amount"
                                            type="number"
                                            min={selectedLoanType?.min || 1}
                                            max={selectedLoanType?.max}
                                            step="0.01"
                                            placeholder="Enter amount in EUR"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className={errors.amount ? 'border-red-500' : ''}
                                            disabled={!data.loan_type}
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
                                        {selectedLoanType && (
                                            <p className="mb-1 text-xs text-muted-foreground">
                                                Max: {selectedLoanType.max_repayment_months} month
                                                {selectedLoanType.max_repayment_months > 1 ? 's' : ''}
                                            </p>
                                        )}
                                        <Select
                                            value={data.repayment_period_months}
                                            onValueChange={(value) => setData('repayment_period_months', value)}
                                            disabled={!data.loan_type}
                                        >
                                            <SelectTrigger className={errors.repayment_period_months ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select repayment period..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredRepaymentPeriods.map((period) => (
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
                                        <Button type="submit" disabled={processing || !userCategory || !data.loan_type} className="flex-1">
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
                                        <span>Interest ({selectedLoanType?.interest_rate || 0}%):</span>
                                        <span className="font-medium">
                                            {formatEuros(selectedLoanType ? parseFloat(data.amount) * (selectedLoanType.interest_rate / 100) : 0)}
                                        </span>
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
                                    <strong>Your Category:</strong>
                                    <p className="text-muted-foreground">
                                        {userCategory ? `Category ${userCategory}` : 'Not assigned - contact admin'}
                                    </p>
                                </div>
                                {selectedLoanType && (
                                    <div>
                                        <strong>Interest Rate:</strong>
                                        <p className="text-muted-foreground">{selectedLoanType.interest_rate}% monthly interest</p>
                                    </div>
                                )}
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
