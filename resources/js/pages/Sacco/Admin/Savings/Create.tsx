import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Calendar, Eye, Play, Users } from 'lucide-react';
import { useState } from 'react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface AdminCreateProps {
    currentQuarter: Quarter;
    membersWithoutTargets: {
        data: Member[];
    } & PaginationData;
    totalMembersCount: number;
    membersWithTargetsCount: number;
    monthSavingsExist?: boolean;
    currentMonth?: string;
    completedMonths: string[];
}

interface PreviewData {
    success: boolean;
    quarter: Quarter;
    month: string;
    total_amount: number;
    member_count: number;
    members: Array<{
        id: number;
        name: string;
        email: string;
        target_amount: number;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Admin Panel', href: '/sacco/savings/create' },
];

export default function AdminCreate({
    currentQuarter,
    membersWithoutTargets,
    totalMembersCount,
    membersWithTargetsCount,
    currentMonth = '',
    completedMonths = [],
}: AdminCreateProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const initiateForm = useForm({
        quarter_id: currentQuarter.id,
        month: currentMonth,
    });

    const handlePreview = async () => {
        if (!selectedMonth || !selectedMonth.match(/^\d{4}-\d{2}$/)) {
            console.error('Invalid month format:', selectedMonth);
            return;
        }

        setIsLoadingPreview(true);
        try {
            const response = await axios.post(route('sacco.savings.preview'), {
                quarter_id: currentQuarter.id,
                month: selectedMonth,
            });
            console.log('response', response);
            setPreviewData(response.data);
            setShowPreview(true);
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleInitiateSavings = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMonth || !selectedMonth.match(/^\d{4}-\d{2}$/)) {
            console.error('Invalid month format:', selectedMonth);
            return;
        }

        console.log('Initiating savings with:', {
            quarter_id: currentQuarter.id,
            month: selectedMonth,
        });

        // Set the data directly instead of using transform
        initiateForm.setData({
            quarter_id: currentQuarter.id,
            month: selectedMonth,
        });

        initiateForm.post(route('sacco.savings.initiate'), {
            onSuccess: () => setShowPreview(false),
            onError: (errors) => {
                console.error('Initiate failed:', errors);
            },
        });
    };

    // Generate month options for current quarter
    const quarterMonths = {
        1: ['01', '02', '03', '04'], // Q1: Jan-Apr
        2: ['05', '06', '07', '08'], // Q2: May-Aug
        3: ['09', '10', '11', '12'], // Q3: Sep-Dec
    };

    const availableMonths = quarterMonths[currentQuarter.quarter_number as keyof typeof quarterMonths] || [];

    // Filter out months that already have savings completed
    const uncompletedMonths = availableMonths.filter((month) => {
        const monthValue = `${currentQuarter.year}-${month}`;
        return !completedMonths.includes(monthValue);
    });

    const monthOptions = uncompletedMonths.map((month) => {
        const date = new Date(currentQuarter.year, parseInt(month) - 1, 1);
        return {
            value: `${currentQuarter.year}-${month}`,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };
    });
    console.log('previewData', previewData);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Savings Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sacco/savings">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Savings
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Savings Administration</h1>
                            <p className="text-muted-foreground">
                                Manage quarterly targets and initiate monthly savings for Q{currentQuarter.quarter_number} {currentQuarter.year}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overview Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Member Overview
                        </CardTitle>
                        <CardDescription>Current status of savings targets for this quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                                <p className="text-lg font-semibold">{totalMembersCount}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Members with Targets</p>
                                <p className="text-lg font-semibold">{membersWithTargetsCount}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Missing Targets</p>
                                <p className="text-lg font-semibold text-red-600">{membersWithoutTargets.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members without targets warning */}
                {membersWithoutTargets.total > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Members Missing Savings Targets</CardTitle>
                            <CardDescription>
                                These members need to set their quarterly savings targets before monthly savings can be initiated
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {membersWithoutTargets.data.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                            </div>
                                            <Badge variant="destructive">No Target Set</Badge>
                                        </div>
                                    ))}
                                </div>
                                <Pagination data={membersWithoutTargets} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Monthly Savings Initiation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Monthly Savings Initiation
                        </CardTitle>
                        <CardDescription>
                            Initiate monthly savings for all members based on their quarterly targets. Showing available months for Q
                            {currentQuarter.quarter_number} {currentQuarter.year}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <Label htmlFor="month">Select Month</Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.length > 0 ? (
                                            monthOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No remaining months in Q{currentQuarter.quarter_number} {currentQuarter.year}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {monthOptions.length === 0 && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        All months in this quarter have been completed or no months are available.
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handlePreview}
                                variant="outline"
                                disabled={!selectedMonth || membersWithoutTargets.total > 0 || monthOptions.length === 0 || isLoadingPreview}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {isLoadingPreview ? 'Loading...' : 'Preview Savings'}
                            </Button>
                        </div>

                        {membersWithoutTargets.total > 0 && (
                            <div className="rounded-lg bg-yellow-50 p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Warning:</strong> Cannot initiate savings until all members have set their quarterly targets.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview Dialog */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Savings Initiation Preview</DialogTitle>
                            <DialogDescription>Review the savings initiation for {previewData?.month} before confirming</DialogDescription>
                        </DialogHeader>

                        {previewData && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-2xl font-bold">{formatEuros(previewData.total_amount)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Members</p>
                                        <p className="text-2xl font-bold">{previewData.member_count}</p>
                                    </div>
                                </div>

                                <div className="max-h-64 space-y-2 overflow-y-auto">
                                    <h4 className="font-medium">Member Contributions</h4>
                                    {previewData.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between rounded border p-2">
                                            <span className="text-sm">{member.name}</span>
                                            <Badge variant="outline">{formatEuros(member.target_amount)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPreview(false)}>
                                Cancel
                            </Button>
                            <form onSubmit={handleInitiateSavings} className="inline">
                                <Button type="submit" disabled={initiateForm.processing}>
                                    <Play className="mr-2 h-4 w-4" />
                                    {initiateForm.processing ? 'Initiating...' : 'Confirm & Initiate'}
                                </Button>
                            </form>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
