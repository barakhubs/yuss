import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, DollarSign, Info, PiggyBank, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
    shareout_activated: boolean;
}

interface ExistingDecision {
    id: number;
    wants_shareout: boolean;
    savings_balance: number;
    interest_amount: number;
    shareout_completed: boolean;
    decision_made_at: string;
    shareout_completed_at?: string;
}

interface MemberShareOutProps {
    quarter: Quarter;
    quarterSavings: number;
    interestShareOut: number;
    isInterestShareOutQuarter: boolean;
    existingDecision?: ExistingDecision;
    canMakeDecision: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'My Savings', href: '/sacco/savings' },
    { title: 'Share-Out Decision', href: '/sacco/savings/share-out' },
];

export default function MemberShareOut({
    quarter,
    quarterSavings,
    interestShareOut,
    isInterestShareOutQuarter,
    existingDecision,
    canMakeDecision,
}: MemberShareOutProps) {
    const [selectedOption, setSelectedOption] = useState<string>(existingDecision ? (existingDecision.wants_shareout ? 'shareout' : 'keep') : '');

    const { setData, post, processing, errors } = useForm({
        wants_shareout: existingDecision?.wants_shareout ?? false,
        quarter_id: quarter.id,
    });

    const handleSubmit = (wantsShareout: boolean) => {
        setData('wants_shareout', wantsShareout);
        post(route('sacco.savings.share-out.decision'), {
            onSuccess: () => {
                // Decision submitted successfully
            },
        });
    };

    const totalShareOut = quarterSavings + (isInterestShareOutQuarter ? interestShareOut : 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Share-Out Decision - Q${quarter.quarter_number} ${quarter.year}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Share-Out Decision</h1>
                        <p className="text-muted-foreground">
                            Make your decision for Q{quarter.quarter_number} {quarter.year}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Current Status */}
                {existingDecision && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            {existingDecision.shareout_completed ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Your share-out has been completed on{' '}
                                    {existingDecision.shareout_completed_at && new Date(existingDecision.shareout_completed_at).toLocaleDateString()}
                                </span>
                            ) : (
                                <span>
                                    You have chosen to{' '}
                                    <strong>{existingDecision.wants_shareout ? 'share out your savings' : 'keep your savings'}</strong>. Decision made
                                    on {new Date(existingDecision.decision_made_at).toLocaleDateString()}.
                                    {canMakeDecision && ' You can update your decision below.'}
                                </span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Savings Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4 text-blue-600" />
                                <div className="text-sm font-medium text-muted-foreground">Current Savings</div>
                            </div>
                            <div className="text-2xl font-bold">{formatEuros(quarterSavings)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <div className="text-sm font-medium text-muted-foreground">
                                    {isInterestShareOutQuarter ? 'Interest Share (Q3)' : 'Interest Share'}
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{isInterestShareOutQuarter ? formatEuros(interestShareOut) : formatEuros(0)}</div>
                            {!isInterestShareOutQuarter && <p className="text-xs text-muted-foreground">Interest distributed in Q3 only</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-orange-600" />
                                <div className="text-sm font-medium text-muted-foreground">Total Share-Out</div>
                            </div>
                            <div className="text-2xl font-bold">{formatEuros(totalShareOut)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Decision Form */}
                {canMakeDecision ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Make Your Decision</CardTitle>
                            <CardDescription>Choose whether you want to share out your savings or keep them for the next quarter.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Share Out Option */}
                                    <Card
                                        className={`cursor-pointer border-2 transition-colors ${
                                            selectedOption === 'shareout' ? 'border-orange-600 bg-orange-50' : 'border-gray-200'
                                        }`}
                                        onClick={() => setSelectedOption('shareout')}
                                    >
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-orange-600" />
                                                    <span className="font-semibold">Share Out</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {isInterestShareOutQuarter
                                                        ? `Withdraw your savings plus interest share (${formatEuros(totalShareOut)})`
                                                        : `Withdraw your savings (${formatEuros(totalShareOut)})`}
                                                </p>
                                                <ul className="space-y-1 text-xs text-muted-foreground">
                                                    <li>• Receive your money immediately</li>
                                                    {isInterestShareOutQuarter && <li>• Includes your loan interest share</li>}
                                                    <li>• Start fresh next quarter</li>
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Keep Savings Option */}
                                    <Card
                                        className={`cursor-pointer border-2 transition-colors ${
                                            selectedOption === 'keep' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                                        }`}
                                        onClick={() => setSelectedOption('keep')}
                                    >
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <PiggyBank className="h-4 w-4 text-blue-600" />
                                                    <span className="font-semibold">Keep Savings</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Continue saving for the next quarter</p>
                                                <ul className="space-y-1 text-xs text-muted-foreground">
                                                    <li>• Maintain your current balance</li>
                                                    <li>• Continue building your savings</li>
                                                    <li>• Earn more interest over time</li>
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {errors.wants_shareout && <div className="text-sm text-red-600">{errors.wants_shareout}</div>}

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => handleSubmit(selectedOption === 'shareout')}
                                        disabled={!selectedOption || processing}
                                        className="min-w-32"
                                    >
                                        {processing ? 'Saving...' : 'Save Decision'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4 text-center">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                                <div>
                                    <h3 className="text-lg font-semibold">Decision Complete</h3>
                                    <p className="text-muted-foreground">
                                        {existingDecision?.shareout_completed
                                            ? 'Your share-out has been processed.'
                                            : 'Your decision has been recorded and cannot be changed.'}
                                    </p>
                                </div>
                                {existingDecision && (
                                    <Badge variant={existingDecision.wants_shareout ? 'destructive' : 'default'} className="text-sm">
                                        {existingDecision.wants_shareout ? 'Share Out' : 'Keep Savings'}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Important Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                • <strong>Share-Out:</strong> If you choose to share out, you will receive your savings
                                {isInterestShareOutQuarter ? ' plus your interest share from loans' : ''}.
                            </p>
                            <p>
                                • <strong>Keep Savings:</strong> Your savings will be carried forward to the next quarter to continue growing.
                            </p>
                            {isInterestShareOutQuarter && (
                                <p>
                                    • <strong>Q3 Interest Share:</strong> This quarter includes your share of loan interest collected during the year.
                                </p>
                            )}
                            <p>
                                • <strong>Decision Deadline:</strong> Make sure to submit your decision before the quarter ends.
                            </p>
                            <p>
                                • <strong>Processing:</strong> Share-out payments will be processed by the SACCO committee after the quarter closes.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
