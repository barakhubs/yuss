import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, PiggyBank, Target } from 'lucide-react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface MemberSavingsTarget {
    id: number;
    monthly_target: number;
    created_at: string;
}

interface SetTargetProps {
    currentQuarter: Quarter;
    currentTarget: MemberSavingsTarget | null;
    quarterSaved: number;
    canEditTarget: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Set Target', href: '/sacco/savings/create' },
];

export default function SetTarget({ currentQuarter, currentTarget, quarterSaved }: SetTargetProps) {
    const { data, setData, post, processing, errors } = useForm({
        monthly_target: currentTarget?.monthly_target || '',
        quarter_id: currentQuarter.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sacco.savings.target.store'));
    };

    const quarterlyTarget = Number(data.monthly_target) * 4;
    const targetCompletion = quarterlyTarget > 0 ? Math.round((quarterSaved / quarterlyTarget) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Set Savings Target" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Set Savings Target</h1>
                        <p className="text-gray-600">
                            Set your monthly savings target for Q{currentQuarter.quarter_number} {currentQuarter.year}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Savings
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Current Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PiggyBank className="h-5 w-5" />
                                Current Quarter Status
                            </CardTitle>
                            <CardDescription>
                                Q{currentQuarter.quarter_number} {currentQuarter.year} savings progress
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm text-gray-600">Amount Saved This Quarter</Label>
                                <div className="text-2xl font-bold text-green-600">{formatEuros(quarterSaved)}</div>
                            </div>

                            {currentTarget && (
                                <>
                                    <div>
                                        <Label className="text-sm text-gray-600">Monthly Target</Label>
                                        <div className="text-lg font-semibold">{formatEuros(currentTarget.monthly_target)}</div>
                                    </div>

                                    <div>
                                        <Label className="text-sm text-gray-600">Quarterly Target</Label>
                                        <div className="text-lg font-semibold">{formatEuros(currentTarget.monthly_target * 4)}</div>
                                    </div>

                                    <div>
                                        <Label className="text-sm text-gray-600">Target Completion</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg font-semibold">{targetCompletion}%</div>
                                            <div className="h-2 flex-1 rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-green-500 transition-all"
                                                    style={{ width: `${Math.min(targetCompletion, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Set Target Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                {currentTarget ? 'Your Savings Target' : 'Set Savings Target'}
                            </CardTitle>
                            <CardDescription>
                                {currentTarget
                                    ? 'You have already set your target for this quarter'
                                    : 'Set how much you want to save each month this quarter'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentTarget ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="mb-2 text-sm text-green-800">
                                            Target set on {new Date(currentTarget.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-lg font-semibold text-green-900">
                                            {formatEuros(currentTarget.monthly_target)} per month
                                        </div>
                                        <div className="text-sm text-green-700">
                                            Total quarterly target: {formatEuros(currentTarget.monthly_target * 4)}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        <p>
                                            You can only set your target once per quarter. The admin will use this target to automatically generate
                                            your monthly savings.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="monthly_target">Monthly Savings Target (€)</Label>
                                        <Input
                                            id="monthly_target"
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            max="100000"
                                            value={data.monthly_target}
                                            onChange={(e) => setData('monthly_target', e.target.value)}
                                            placeholder="Enter your monthly target amount"
                                            className="mt-1"
                                        />
                                        {errors.monthly_target && <p className="mt-1 text-sm text-red-600">{errors.monthly_target}</p>}
                                    </div>

                                    {data.monthly_target && Number(data.monthly_target) > 0 && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <div className="mb-1 text-sm text-blue-800">Quarterly Projection</div>
                                            <div className="text-lg font-semibold text-blue-900">
                                                {formatEuros(quarterlyTarget)} total for 4 months
                                            </div>
                                            <div className="text-sm text-blue-700">This amount will be automatically saved each month</div>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={processing || !data.monthly_target} className="w-full">
                                        {processing ? 'Setting Target...' : 'Set Savings Target'}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>How the Savings System Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-xs font-semibold text-blue-600">1</span>
                            </div>
                            <div>
                                <p className="font-medium">Set Your Target</p>
                                <p className="text-sm text-gray-600">Choose how much you want to save each month for this quarter.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-xs font-semibold text-blue-600">2</span>
                            </div>
                            <div>
                                <p className="font-medium">Automatic Monthly Savings</p>
                                <p className="text-sm text-gray-600">The admin will initiate monthly savings based on your target amount.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-xs font-semibold text-blue-600">3</span>
                            </div>
                            <div>
                                <p className="font-medium">Share-out Option</p>
                                <p className="text-sm text-gray-600">
                                    At the end of the quarter, you can choose to share out your savings or keep them for the next quarter.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
