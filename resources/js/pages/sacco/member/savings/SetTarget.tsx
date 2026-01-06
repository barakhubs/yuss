import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CategoryInfo {
    category: 'A' | 'B' | 'C';
    monthly_amount: number;
    display: string;
}

interface SetTargetProps {
    currentQuarter: Quarter;
    currentTarget: MemberSavingsTarget | null;
    quarterSaved: number;
    canEditTarget: boolean;
    categoryInfo: CategoryInfo | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Set Target', href: '/sacco/savings/create' },
];

export default function SetTarget({ currentQuarter, currentTarget, quarterSaved, categoryInfo }: SetTargetProps) {
    const { data, setData, post, processing, errors } = useForm({
        quarter_id: currentQuarter.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sacco.savings.target.store'));
    };

    const monthlyTarget = categoryInfo?.monthly_amount || currentTarget?.monthly_target || 0;
    const quarterlyTarget = monthlyTarget * 4;
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
                                {currentTarget ? 'Your Savings Target' : 'Confirm Savings Target'}
                            </CardTitle>
                            <CardDescription>
                                {currentTarget
                                    ? 'You have already set your target for this quarter'
                                    : categoryInfo
                                      ? `Your savings amount is based on your category: ${categoryInfo.display}`
                                      : 'No savings category assigned'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!categoryInfo && !currentTarget ? (
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold">No Category Assigned</p>
                                        <p className="mt-2">
                                            You need to have a savings category (A, B, or C) assigned before you can set your quarterly target. Please
                                            contact the administrator to assign you a category.
                                        </p>
                                    </div>
                                </div>
                            ) : currentTarget ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="mb-2 text-sm text-green-800">
                                            Target confirmed on {new Date(currentTarget.created_at).toLocaleDateString()}
                                        </div>
                                        {categoryInfo && (
                                            <div className="mb-2 text-sm text-green-800">
                                                <span className="font-semibold">{categoryInfo.display}</span>
                                            </div>
                                        )}
                                        <div className="text-lg font-semibold text-green-900">
                                            {formatEuros(currentTarget.monthly_target)} per month
                                        </div>
                                        <div className="text-sm text-green-700">
                                            Total quarterly target: {formatEuros(currentTarget.monthly_target * 4)}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        <p>
                                            You can only confirm your target once per quarter. The admin will use this target to automatically
                                            generate your monthly savings.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {categoryInfo && (
                                        <>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <div className="mb-2 text-sm text-blue-800">
                                                    <span className="font-semibold">Your Savings Category</span>
                                                </div>
                                                <div className="text-2xl font-bold text-blue-900">Category {categoryInfo.category}</div>
                                                <div className="mt-3 space-y-1">
                                                    <div className="text-sm text-blue-800">
                                                        <span className="font-semibold">Monthly Savings:</span>{' '}
                                                        {formatEuros(categoryInfo.monthly_amount)}
                                                    </div>
                                                    <div className="text-sm text-blue-800">
                                                        <span className="font-semibold">Quarterly Total:</span>{' '}
                                                        {formatEuros(categoryInfo.monthly_amount * 4)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                <div className="mb-1 text-sm font-semibold text-gray-800">Savings Breakdown (per month)</div>
                                                <div className="mt-2 space-y-1 text-sm text-gray-700">
                                                    <div className="flex justify-between">
                                                        <span>Main Savings (75%):</span>
                                                        <span className="font-medium">{formatEuros(categoryInfo.monthly_amount * 0.75)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Social Fund (17.5%):</span>
                                                        <span className="font-medium">{formatEuros(categoryInfo.monthly_amount * 0.175)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Welfare Fund (7.5%):</span>
                                                        <span className="font-medium">{formatEuros(categoryInfo.monthly_amount * 0.075)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Button type="submit" disabled={processing || !categoryInfo} className="w-full">
                                        {processing ? 'Confirming Target...' : 'Confirm Savings Target'}
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
