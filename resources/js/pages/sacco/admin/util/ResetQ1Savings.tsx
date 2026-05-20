import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MappingEntry {
    index: number;
    label: string;
    category: string;
    suggested_user_id: string | null;
    suggested_user_name: string | null;
    auto_matched: boolean;
}

interface UserOption {
    id: string;
    name: string;
    email: string;
    created_at: string;
    savings_start_date: string | null;
    savings_category: string | null;
}

interface Quarter {
    id: string;
    name: string;
}

interface ExecutionResult {
    label: string;
    user?: string;
    category?: string;
    status: 'done' | 'skipped';
    months?: number;
    total_saved?: number;
    note?: string;
    reason?: string;
}

interface Props {
    mapping: MappingEntry[];
    allUsers: UserOption[];
    quarter: Quarter | null;
}

const CATEGORIES = ['A', 'B', 'C', 'D', 'E'] as const;
const MONTHLY: Record<string, number> = { A: 500, B: 300, C: 100, D: 50, E: 25 };

const Q1_START = new Date('2026-01-01');

function getStartMonth(user: UserOption): number {
    // Prefer explicit savings_start_date; fall back to created_at
    const dateStr = user.savings_start_date ?? user.created_at;
    const d = new Date(dateStr);
    if (d < Q1_START) return 1;
    const m = d.getMonth() + 1;
    return m > 4 ? 5 : m;
}

function monthName(m: number) {
    return ['January', 'February', 'March', 'April'][m - 1] ?? '—';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Settings', href: '/sacco/settings' },
    { title: 'Reset Q1 2026 Savings', href: '/sacco/util/reset-q1-2026-savings' },
];

export default function ResetQ1Savings({ mapping, allUsers, quarter }: Props) {
    const { props } = usePage<{ flash: { success?: string; execution_results?: ExecutionResult[] } }>();

    // Local editable state: user_id and category per row
    const [rows, setRows] = useState(() =>
        mapping.map((m) => ({
            index: m.index,
            label: m.label,
            category: m.category,
            user_id: m.suggested_user_id ?? '',
        })),
    );

    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<ExecutionResult[] | null>(null);

    useEffect(() => {
        if (props.flash?.execution_results) {
            setResults(props.flash.execution_results);
        }
    }, [props.flash?.execution_results]);

    const setRowUser = (index: number, userId: string) => {
        setRows((prev) => prev.map((r) => (r.index === index ? { ...r, user_id: userId } : r)));
    };

    const setRowCategory = (index: number, category: string) => {
        setRows((prev) => prev.map((r) => (r.index === index ? { ...r, category } : r)));
    };

    const userById = (id: string) => allUsers.find((u) => u.id === id);

    const unmatchedCount = rows.filter((r) => !r.user_id).length;

    const handleExecute = () => {
        setProcessing(true);
        router.post('/sacco/util/reset-q1-2026-savings', { mapping: rows }, { onFinish: () => setProcessing(false) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reset Q1 2026 Savings" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Q1 2026 Savings Setup</h1>
                    <p className="text-muted-foreground">
                        Review the constitution member list, confirm each DB user match and category, then execute. This will delete all existing
                        savings for matched members and recreate Q1 2026 records.
                    </p>
                </div>

                {/* Quarter warning */}
                {!quarter && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p>
                            <strong>Q1 2026 quarter not found.</strong> Create it first in Settings → Quarters before running this utility.
                        </p>
                    </div>
                )}

                {unmatchedCount > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p>
                            <strong>{unmatchedCount} member(s) not auto-matched.</strong> Select the correct DB user from the dropdown for each
                            highlighted row before executing.
                        </p>
                    </div>
                )}

                {/* Mapping table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Member → Category Mapping</CardTitle>
                        <CardDescription>
                            Each row is a member from the YUSSAL Constitution. Select the matching DB user and confirm the category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Constitution Name</TableHead>
                                    <TableHead>DB User</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Start Month</TableHead>
                                    <TableHead>Months × Amount</TableHead>
                                    <TableHead className="w-10">Match</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => {
                                    const user = userById(row.user_id);
                                    const startM = user ? getStartMonth(user) : null;
                                    const months = startM && startM <= 4 ? 4 - startM + 1 : 0;
                                    const monthly = MONTHLY[row.category] ?? 0;
                                    const autoMatched = mapping[row.index]?.auto_matched;

                                    return (
                                        <TableRow key={row.index} className={!row.user_id ? 'bg-amber-50' : ''}>
                                            <TableCell className="font-mono text-xs font-medium">{row.label}</TableCell>
                                            <TableCell>
                                                <Select value={row.user_id} onValueChange={(v) => setRowUser(row.index, v)}>
                                                    <SelectTrigger className="h-8 w-[220px] text-xs">
                                                        <SelectValue placeholder="— select user —" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allUsers.map((u) => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.name}
                                                                <span className="ml-1 text-xs text-muted-foreground">({u.email})</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select value={row.category} onValueChange={(v) => setRowCategory(row.index, v)}>
                                                    <SelectTrigger className="h-8 w-20 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIES.map((c) => (
                                                            <SelectItem key={c} value={c}>
                                                                Cat {c} — {formatEuros(MONTHLY[c])}/mo
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {startM ? (
                                                    startM > 4 ? (
                                                        <span className="text-muted-foreground">After Q1</span>
                                                    ) : (
                                                        monthName(startM)
                                                    )
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {user && months > 0 ? (
                                                    <span>
                                                        {months} × {formatEuros(monthly)} = <strong>{formatEuros(months * monthly)}</strong>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!row.user_id ? (
                                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                                ) : autoMatched ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" title="Auto-matched" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-blue-500" title="Manually matched" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Execute */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                        {unmatchedCount > 0 ? (
                            <span className="text-amber-600">Resolve {unmatchedCount} unmatched row(s) before executing.</span>
                        ) : (
                            <span className="text-green-600">All {rows.length} rows are mapped. Ready to execute.</span>
                        )}
                    </div>
                    <Button onClick={handleExecute} disabled={processing || !quarter} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                        {processing ? 'Running…' : 'Execute — Reset & Seed Q1 2026'}
                    </Button>
                </div>

                {/* Results after execution */}
                {results && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Execution Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Constitution Name</TableHead>
                                        <TableHead>DB User</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Months</TableHead>
                                        <TableHead>Total Saved</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((r, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs">{r.label}</TableCell>
                                            <TableCell>{r.user ?? '—'}</TableCell>
                                            <TableCell>{r.category ? `Cat ${r.category}` : '—'}</TableCell>
                                            <TableCell>{r.months ?? '—'}</TableCell>
                                            <TableCell>{r.total_saved !== undefined ? formatEuros(r.total_saved) : '—'}</TableCell>
                                            <TableCell>
                                                {r.status === 'done' ? (
                                                    <Badge variant="default">{r.note ?? 'Done'}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{r.reason ?? 'Skipped'}</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
