import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEuros } from '@/lib/currency';
import { useState } from 'react';

interface PreviewRow {
    id: string;
    loan_number: string;
    member_name: string | null;
    status: string;
    disbursed_date: string | null;
    last_payment_date: string | null;
    last_payment_amount: number | null;
    monthly_installment: number;
    installments_due: number;
    payments_recorded: number;
    cumulative_due: number;
    outstanding_balance: number;
}

export default function LoanBatchPreview() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<PreviewRow[]>([]);
    const [dryRun, setDryRun] = useState(true);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const url = route('sacco.loans.batch.preview', { start_year: new Date().getFullYear(), exclude_current: 1, scope: 'all' });
            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setRows(json.data || []);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const runBatch = async () => {
        setRunning(true);
        setSummary(null);
        try {
            const url = route('sacco.loans.batch.run');
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ loan_ids: [], start_year: new Date().getFullYear(), exclude_current: 1, dry_run: dryRun }),
            });
            const json = await res.json();
            setSummary(json.summary || json);
            // if real run, refresh preview
            if (!dryRun) await fetchPreview();
        } catch (e) {
            console.error(e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (v) fetchPreview();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">Preview Deductions (Jan → prev month)</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Affected Loans (Jan → previous month)</DialogTitle>
                <DialogDescription className="mb-4">
                    This preview shows expected cumulative dues per loan (excluding current month).
                </DialogDescription>

                <div className="mb-4 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} /> Dry run (no DB changes)
                    </label>
                    <div className="ml-auto text-sm text-muted-foreground">{loading ? 'Loading...' : `${rows.length} loans`}</div>
                </div>

                <div className="max-h-64 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Loan #</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Last Payment</TableHead>
                                <TableHead>Monthly</TableHead>
                                <TableHead>Due (cumulative)</TableHead>
                                <TableHead>Outstanding</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.loan_number}</TableCell>
                                    <TableCell>{r.member_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        {r.last_payment_date
                                            ? `${new Date(r.last_payment_date).toLocaleDateString()} (${formatEuros(r.last_payment_amount || 0)})`
                                            : 'None'}
                                    </TableCell>
                                    <TableCell>{formatEuros(r.monthly_installment)}</TableCell>
                                    <TableCell>{formatEuros(r.cumulative_due)}</TableCell>
                                    <TableCell>{formatEuros(r.outstanding_balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {summary && (
                    <div className="mt-4 rounded border p-3">
                        <p className="font-medium">Run Summary</p>
                        <pre className="text-sm">{JSON.stringify(summary, null, 2)}</pre>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={running}>
                        Close
                    </Button>
                    <Button onClick={runBatch} disabled={running}>
                        {running ? 'Running...' : dryRun ? 'Run Dry-Run' : 'Run Deductions'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
