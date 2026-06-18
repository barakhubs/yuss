import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEuros } from '@/lib/currency';
import { useMemo, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Quarter {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface Loan {
    id: string;
    user: User;
    quarter: Quarter;
    loan_number: string;
    amount: number;
    total_amount: number;
    outstanding_balance: number;
    status: string;
    purpose: string;
    applied_date: string;
    approved_date?: string;
    approved_by?: User;
    disbursed_date?: string;
    expected_repayment_date?: string;
    repayment_period_months?: number;
}

interface LoanRepayment {
    id: string;
    amount: number;
    payment_date: string;
    notes?: string;
    created_at: string;
}

interface MonthRow {
    monthKey: string;
    monthLabel: string;
    paymentDate: string;
    monthlyInstallment: number;
    paymentsRecorded: number;
    alreadyPaid: boolean;
}

interface LoanRepaymentsBulkProps {
    loan: Loan;
    repayments?: LoanRepayment[];
}

export default function LoanRepaymentsBulk({ loan, repayments = [] }: LoanRepaymentsBulkProps) {
    const [open, setOpen] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [dryRun, setDryRun] = useState(true);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const monthMap = useMemo(() => {
        return (repayments || []).reduce<Record<string, number>>((map, repayment) => {
            const date = new Date(repayment.payment_date);
            if (!isNaN(date.getTime())) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                map[key] = (map[key] || 0) + Number(repayment.amount);
            }
            return map;
        }, {});
    }, [repayments]);

    const months = useMemo<MonthRow[]>(() => {
        if (!loan.applied_date || !loan.repayment_period_months) {
            return [];
        }

        const startDate = new Date(loan.applied_date);
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const nowDate = new Date();
        const previousMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        let endMonth = previousMonth;

        if (loan.expected_repayment_date) {
            const expectedEnd = new Date(loan.expected_repayment_date);
            const expectedMonth = new Date(expectedEnd.getFullYear(), expectedEnd.getMonth(), 1);
            if (expectedMonth < endMonth) {
                endMonth = expectedMonth;
            }
        }

        if (startMonth > endMonth) {
            return [];
        }

        const monthlyInstallment = Number((loan.total_amount / Math.max(1, loan.repayment_period_months)).toFixed(2));
        const rows: MonthRow[] = [];
        let current = new Date(startMonth);

        while (current <= endMonth) {
            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            const paymentDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            rows.push({
                monthKey,
                monthLabel: paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                paymentDate: paymentDate.toISOString().split('T')[0],
                monthlyInstallment,
                paymentsRecorded: monthMap[monthKey] || 0,
                alreadyPaid: (monthMap[monthKey] || 0) > 0,
            });
            current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        }

        return rows;
    }, [loan, monthMap]);

    const selectedRows = useMemo(() => months.filter((month) => selectedMonths.includes(month.monthKey)), [months, selectedMonths]);

    const totalSelectedAmount = useMemo(() => selectedRows.reduce((sum, row) => sum + row.monthlyInstallment, 0), [selectedRows]);

    const handleToggleMonth = (monthKey: string) => {
        setSelectedMonths((prev) => (prev.includes(monthKey) ? prev.filter((id) => id !== monthKey) : [...prev, monthKey]));
    };

    const handleSelectAll = () => {
        const keys = months.filter((month) => !month.alreadyPaid).map((month) => month.monthKey);
        setSelectedMonths(keys);
    };

    const handleClear = () => {
        setSelectedMonths([]);
    };

    const runBatch = async () => {
        setRunning(true);
        setError(null);
        setSummary(null);

        if (!selectedMonths.length) {
            setError('Select at least one repayment month.');
            setRunning(false);
            return;
        }

        try {
            const url = route('sacco.loans.batch.repay', loan.id);
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    selected_months: selectedMonths,
                    dry_run: dryRun,
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                const text = await res.text().catch(() => null);
                throw new Error(json?.message || text || 'Failed to run batch repayment');
            }

            const json = await res.json();
            if (dryRun) {
                setSummary(json.summary || json);
            }

            if (!dryRun) {
                window.location.reload();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setRunning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
            <DialogTrigger asChild>
                <Button variant="outline">Record Multiple Months</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Repayments</DialogTitle>
                    <DialogDescription>
                        Select repayment months from the loan start month through the previous month, then record them in one action.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button variant="secondary" size="sm" onClick={handleSelectAll} disabled={!months.length}>
                        Select all unpaid
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        Clear selection
                    </Button>
                    <div className="ml-auto flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{months.length} months available</span>
                        <span>{selectedRows.length} selected</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
                        <p>
                            Start month:{' '}
                            <strong>
                                {loan.applied_date
                                    ? new Date(loan.applied_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : 'N/A'}
                            </strong>
                        </p>
                        <p>
                            Last selectable month: <strong>{months.length ? months[months.length - 1].monthLabel : 'None'}</strong>
                        </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Select</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Scheduled</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {months.map((month) => (
                                    <TableRow key={month.monthKey}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedMonths.includes(month.monthKey)}
                                                disabled={month.alreadyPaid}
                                                onChange={() => handleToggleMonth(month.monthKey)}
                                            />
                                        </TableCell>
                                        <TableCell>{month.monthLabel}</TableCell>
                                        <TableCell>{formatEuros(month.monthlyInstallment)}</TableCell>
                                        <TableCell>
                                            {month.alreadyPaid ? (
                                                <span className="text-sm text-green-700">Already paid</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Pending</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {months.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                            No selectable repayment months available.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="rounded-lg border bg-muted p-4 text-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Selected months: <strong>{selectedRows.length}</strong>
                            </span>
                            <span>
                                Estimated total: <strong>{formatEuros(totalSelectedAmount)}</strong>
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            The actual repayment records will use the loan repayment schedule and preserve interest/principal split.
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                    <input id="dryRun" type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                    <label htmlFor="dryRun" className="text-sm">
                        Dry run (preview only)
                    </label>
                </div>

                {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>}
                {dryRun && summary && (
                    <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-medium">Summary</p>
                        <pre className="text-xs break-words whitespace-pre-wrap">{JSON.stringify(summary, null, 2)}</pre>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={running}>
                        Close
                    </Button>
                    <Button onClick={runBatch} disabled={running || selectedRows.length === 0}>
                        {running ? 'Recording...' : dryRun ? 'Preview Run' : 'Record Payments'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
