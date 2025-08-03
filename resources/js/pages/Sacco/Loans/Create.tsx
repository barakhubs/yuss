import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import React from 'react';

interface Organization {
    id: number;
    name: string;
}

interface SaccoYear {
    id: number;
    year: number;
}

interface LoansCreateProps {
    organization: Organization;
    currentYear: SaccoYear;
    userSavings: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Loans', href: '/sacco/loans' },
    { title: 'Apply', href: '/sacco/loans/create' },
];

export default function LoansCreate({ organization, currentYear, userSavings }: LoansCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        principal_amount: '',
        purpose: '',
        expected_repayment_date: '',
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const calculateTotalWithInterest = (principal: number) => {
        const interest = principal * 0.05; // 5% interest
        return principal + interest;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sacco/loans');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Apply for Loan - ${organization.name}`} />

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
                            <p className="text-muted-foreground">Submit your loan application for {currentYear.year}</p>
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
                                        <Label htmlFor="principal_amount">Loan Amount</Label>
                                        <Input
                                            id="principal_amount"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="Enter amount in USD"
                                            value={data.principal_amount}
                                            onChange={(e) => setData('principal_amount', e.target.value)}
                                            className={errors.principal_amount ? 'border-red-500' : ''}
                                        />
                                        {errors.principal_amount && <p className="mt-1 text-sm text-red-500">{errors.principal_amount}</p>}
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
                                        <Label htmlFor="expected_repayment_date">Expected Repayment Date</Label>
                                        <Input
                                            id="expected_repayment_date"
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={data.expected_repayment_date}
                                            onChange={(e) => setData('expected_repayment_date', e.target.value)}
                                            className={errors.expected_repayment_date ? 'border-red-500' : ''}
                                        />
                                        {errors.expected_repayment_date && (
                                            <p className="mt-1 text-sm text-red-500">{errors.expected_repayment_date}</p>
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
                        {/* Loan Calculator */}
                        {data.principal_amount && !isNaN(parseFloat(data.principal_amount)) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span>Principal Amount:</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(data.principal_amount))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Interest (5%):</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(data.principal_amount) * 0.05)}</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between font-bold">
                                            <span>Total to Repay:</span>
                                            <span>{formatCurrency(calculateTotalWithInterest(parseFloat(data.principal_amount)))}</span>
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
                                <p className="text-2xl font-bold">{formatCurrency(userSavings)}</p>
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
