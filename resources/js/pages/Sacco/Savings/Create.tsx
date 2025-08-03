import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, PiggyBank } from 'lucide-react';

interface SaccoQuarter {
    id: number;
    quarter: number;
    sacco_year: {
        year: number;
    };
    start_date: string;
    end_date: string;
}

interface SavingsCreateProps {
    quarters: SaccoQuarter[];
    currentQuarter: SaccoQuarter;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Add Savings', href: '/sacco/savings/create' },
];

export default function SavingsCreate({ quarters, currentQuarter }: SavingsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        quarter_id: currentQuarter.id.toString(),
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sacco.savings.store'));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA');
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
                                    Q{currentQuarter.quarter} {currentQuarter.sacco_year.year}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Quarter Period</Label>
                                <p className="text-lg font-semibold">
                                    {formatDate(currentQuarter.start_date)} - {formatDate(currentQuarter.end_date)}
                                </p>
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
                                <Select value={data.quarter_id} onValueChange={(value) => setData('quarter_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quarters.map((quarter) => (
                                            <SelectItem key={quarter.id} value={quarter.id.toString()}>
                                                Q{quarter.quarter} {quarter.sacco_year.year}({formatDate(quarter.start_date)} -{' '}
                                                {formatDate(quarter.end_date)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.quarter_id && <p className="text-sm text-red-600">{errors.quarter_id}</p>}
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

                            <div className="space-y-2">
                                <Label htmlFor="transaction_date">Transaction Date</Label>
                                <Input
                                    id="transaction_date"
                                    type="date"
                                    value={data.transaction_date}
                                    onChange={(e) => setData('transaction_date', e.target.value)}
                                    required
                                />
                                {errors.transaction_date && <p className="text-sm text-red-600">{errors.transaction_date}</p>}
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
