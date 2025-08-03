import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, PiggyBank } from 'lucide-react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface SavingsTarget {
    id: number;
    target_amount: number;
}

interface SavingsCreateProps {
    currentQuarter: Quarter;
    currentTarget?: SavingsTarget;
    quarterSaved: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Add Savings', href: '/sacco/savings/create' },
];

export default function SavingsCreate({ currentQuarter, currentTarget, quarterSaved }: SavingsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        quarter_id: currentQuarter.id.toString(),
        amount: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sacco.savings.store'));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Savings - SACCO" />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/sacco/savings">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Savings
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Savings</h1>
                        <p className="text-muted-foreground">Record a new savings contribution</p>
                    </div>
                </div>

                {/* Current Quarter Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="h-5 w-5" />
                            Current Quarter Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Active Quarter</Label>
                                <p className="text-lg font-semibold">
                                    Q{currentQuarter.quarter_number} {currentQuarter.year}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Quarter Status</Label>
                                <p className="text-lg font-semibold capitalize">{currentQuarter.status}</p>
                            </div>
                            {currentTarget && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Savings Target</Label>
                                    <p className="text-lg font-semibold">{formatCurrency(currentTarget.target_amount)}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Already Saved</Label>
                                <p className="text-lg font-semibold">{formatCurrency(quarterSaved)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Savings Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Savings Details</CardTitle>
                        <CardDescription>Enter the details for your savings contribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="quarter_id">Quarter</Label>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <span className="font-medium">
                                        Q{currentQuarter.quarter_number} {currentQuarter.year}
                                    </span>
                                    <span className="text-sm text-muted-foreground capitalize">{currentQuarter.status}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (CAD)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Enter savings amount"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                />
                                {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button type="submit" disabled={processing} className="flex-1">
                                    <PiggyBank className="mr-2 h-4 w-4" />
                                    {processing ? 'Adding Savings...' : 'Add Savings'}
                                </Button>
                                <Link href="/sacco/savings">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Important Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                            <p className="text-sm text-muted-foreground">
                                Savings contributions are tied to specific quarters and cannot be modified once submitted.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                            <p className="text-sm text-muted-foreground">
                                At the end of each quarter, you can choose to share out your savings or carry them forward.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500"></div>
                            <p className="text-sm text-muted-foreground">
                                Your savings contributions earn interest based on loan repayments and year-end distributions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
