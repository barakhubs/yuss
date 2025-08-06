import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, DollarSign, PiggyBank, Users } from 'lucide-react';
import { useState } from 'react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
    shareout_activated: boolean;
}

interface ShareoutDecision {
    id: number;
    wants_shareout: boolean;
    savings_balance: number;
    interest_amount: number;
    shareout_completed: boolean;
    decision_made_at: string;
    shareout_completed_at?: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
    savings: Array<{
        amount: number;
        shared_out: boolean;
    }>;
    shareoutDecisions: ShareoutDecision[];
}

interface Statistics {
    total_savings: number;
    members_wanting_shareout: number;
    pending_decisions: number;
    completed_shareouts: number;
    total_members: number;
}

interface AdminShareOutProps {
    quarter: Quarter;
    shareOutActivated: boolean;
    members: Member[];
    statistics: Statistics;
    membersWantingShareout: Member[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Share-Out Management', href: '/sacco/savings/share-out' },
];

export default function AdminShareOut({ quarter, shareOutActivated, members, statistics, membersWantingShareout }: AdminShareOutProps) {
    const [selectedDecisions, setSelectedDecisions] = useState<number[]>([]);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);

    const activateForm = useForm({
        quarter_id: quarter.id,
    });

    const completeForm = useForm({
        decision_id: null as number | null,
    });

    const bulkCompleteForm = useForm({
        decision_ids: [] as number[],
    });

    const handleActivateShareOut = () => {
        activateForm.post(route('sacco.savings.share-out.activate'));
    };

    const handleCompleteShareOut = (decisionId: number) => {
        completeForm.setData('decision_id', decisionId);
        completeForm.post(route('sacco.savings.share-out.complete'));
    };

    const handleBulkComplete = () => {
        bulkCompleteForm.setData('decision_ids', selectedDecisions);
        bulkCompleteForm.post(route('sacco.savings.share-out.bulk-complete'), {
            onSuccess: () => {
                setSelectedDecisions([]);
                setShowBulkConfirm(false);
            },
        });
    };

    const toggleSelection = (decisionId: number) => {
        setSelectedDecisions((prev) => (prev.includes(decisionId) ? prev.filter((id) => id !== decisionId) : [...prev, decisionId]));
    };

    const toggleSelectAll = () => {
        const availableDecisions = (membersWantingShareout || [])
            .flatMap((member) => member.shareoutDecisions || [])
            .filter((decision) => decision.wants_shareout && !decision.shareout_completed)
            .map((decision) => decision.id);

        setSelectedDecisions(selectedDecisions.length === availableDecisions.length ? [] : availableDecisions);
    };

    const getMemberShareoutDecision = (member: Member) => {
        return member.shareoutDecisions?.find((decision) => decision.wants_shareout) || null;
    };

    const getMemberSavingsTotal = (member: Member) => {
        return member.savings?.reduce((total, saving) => total + saving.amount, 0) || 0;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Share-Out Management - Q${quarter.quarter_number} ${quarter.year}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Share-Out Management</h1>
                        <p className="text-muted-foreground">
                            Manage quarterly share-out process for Q{quarter.quarter_number} {quarter.year}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.visit('/sacco/savings')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Savings
                    </Button>
                </div>

                {/* Activation Status */}
                {!shareOutActivated ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                                <Clock className="h-5 w-5" />
                                Share-Out Not Activated
                            </CardTitle>
                            <CardDescription>
                                The share-out process has not been activated for this quarter. Members cannot make decisions yet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleActivateShareOut} disabled={activateForm.processing} className="bg-orange-600 hover:bg-orange-700">
                                {activateForm.processing ? 'Activating...' : 'Activate Share-Out Process'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                Share-Out Activated
                            </CardTitle>
                            <CardDescription>
                                Members can now make their share-out decisions. You can process completed decisions below.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {/* Statistics Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <div className="text-sm font-medium text-muted-foreground">Total Savings</div>
                            </div>
                            <div className="text-2xl font-bold">{formatEuros(statistics.total_savings)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <div className="text-sm font-medium text-muted-foreground">Total Members</div>
                            </div>
                            <div className="text-2xl font-bold">{statistics.total_members}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4 text-orange-600" />
                                <div className="text-sm font-medium text-muted-foreground">Want Share-Out</div>
                            </div>
                            <div className="text-2xl font-bold">{statistics.members_wanting_shareout}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <div className="text-sm font-medium text-muted-foreground">Pending Decisions</div>
                            </div>
                            <div className="text-2xl font-bold">{statistics.pending_decisions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div className="text-sm font-medium text-muted-foreground">Completed</div>
                            </div>
                            <div className="text-2xl font-bold">{statistics.completed_shareouts}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members Wanting Share-Out */}
                {shareOutActivated && membersWantingShareout?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Members Requesting Share-Out</CardTitle>
                                    <CardDescription>Members who have chosen to share out their savings this quarter</CardDescription>
                                </div>
                                {selectedDecisions.length > 0 && (
                                    <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">Complete Selected ({selectedDecisions.length})</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Bulk Complete Share-Outs</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to complete share-outs for {selectedDecisions.length} members? This will
                                                    reset their savings balances to zero.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleBulkComplete} disabled={bulkCompleteForm.processing}>
                                                    {bulkCompleteForm.processing ? 'Processing...' : 'Confirm Bulk Complete'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox checked={selectedDecisions.length > 0} onCheckedChange={toggleSelectAll} />
                                        </TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Savings Balance</TableHead>
                                        <TableHead>Interest (5%)</TableHead>
                                        <TableHead>Total Share-Out</TableHead>
                                        <TableHead>Decision Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(membersWantingShareout || []).map((member) => {
                                        const decision = getMemberShareoutDecision(member);
                                        if (!decision) return null;

                                        const totalShareOut = decision.savings_balance + decision.interest_amount;

                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    {!decision.shareout_completed && (
                                                        <Checkbox
                                                            checked={selectedDecisions.includes(decision.id)}
                                                            onCheckedChange={() => toggleSelection(decision.id)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatEuros(decision.savings_balance)}</TableCell>
                                                <TableCell>{formatEuros(decision.interest_amount)}</TableCell>
                                                <TableCell className="font-semibold">{formatEuros(totalShareOut)}</TableCell>
                                                <TableCell>{new Date(decision.decision_made_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={decision.shareout_completed ? 'default' : 'secondary'}>
                                                        {decision.shareout_completed ? 'Completed' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {!decision.shareout_completed ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleCompleteShareOut(decision.id)}
                                                            disabled={completeForm.processing}
                                                        >
                                                            Complete
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Completed{' '}
                                                            {decision.shareout_completed_at &&
                                                                new Date(decision.shareout_completed_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* All Members Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Members Overview</CardTitle>
                        <CardDescription>Complete overview of all members and their share-out status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Savings Balance</TableHead>
                                    <TableHead>Share-Out Decision</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members?.map((member) => {
                                    const savingsTotal = getMemberSavingsTotal(member);
                                    const decision = member.shareoutDecisions?.[0];

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatEuros(savingsTotal)}</TableCell>
                                            <TableCell>
                                                {!decision ? (
                                                    <Badge variant="outline">No Decision</Badge>
                                                ) : decision.wants_shareout ? (
                                                    <Badge variant="destructive">Share Out</Badge>
                                                ) : (
                                                    <Badge variant="default">Keep Savings</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!shareOutActivated ? (
                                                    <Badge variant="outline">Not Activated</Badge>
                                                ) : !decision ? (
                                                    <Badge variant="secondary">Pending Decision</Badge>
                                                ) : decision.shareout_completed ? (
                                                    <Badge variant="default">Completed</Badge>
                                                ) : decision.wants_shareout ? (
                                                    <Badge variant="secondary">Ready to Process</Badge>
                                                ) : (
                                                    <Badge variant="default">Keeping Savings</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
