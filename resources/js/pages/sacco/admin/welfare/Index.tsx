import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Heart, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface Member {
    id: string;
    name: string;
    savings_category: string;
}

interface WelfareClaim {
    id: string;
    member: Member;
    claim_type: 'bereavement' | 'wedding' | 'ceremonial_introduction';
    event_date: string;
    beneficiary_name: string;
    notes?: string;
    group_contribution: number;
    yukon_contribution: number;
    total_payout: number;
    status: 'initiated' | 'paid';
    paid_at?: string;
    created_at: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    links: { url: string | null; label: string; active: boolean }[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    data: WelfareClaim[];
}

interface Filters {
    search?: string;
    status?: string;
}

interface WelfareIndexProps {
    claims: PaginationMeta;
    members: Member[];
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Welfare Support', href: '/sacco/welfare' },
];

const claimTypeLabels: Record<string, string> = {
    bereavement: 'Bereavement',
    wedding: 'Wedding',
    ceremonial_introduction: 'Ceremonial Introduction',
};

const claimTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    bereavement: 'default',
    wedding: 'secondary',
    ceremonial_introduction: 'outline',
};

export default function WelfareIndex({ claims, members, filters }: WelfareIndexProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const form = useForm({
        user_id: '',
        claim_type: '',
        event_date: '',
        beneficiary_name: '',
        notes: '',
    });

    const handleSearch = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        router.get('/sacco/welfare', params, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/sacco/welfare', {
            onSuccess: () => {
                setShowCreateDialog(false);
                form.reset();
            },
        });
    };

    const handleMarkPaid = (claimId: string) => {
        router.post(`/sacco/welfare/${claimId}/pay`, {});
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Welfare Support" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welfare Support</h1>
                        <p className="text-muted-foreground">Manage bereavement, wedding, and ceremonial introduction support</p>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Initiate Support
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Initiate Welfare Support</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="user_id">Member</Label>
                                    <Select value={form.data.user_id} onValueChange={(v) => form.setData('user_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name} (Cat {m.savings_category})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.user_id && <p className="text-sm text-red-600">{form.errors.user_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="claim_type">Support Type</Label>
                                    <Select value={form.data.claim_type} onValueChange={(v) => form.setData('claim_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bereavement">Bereavement</SelectItem>
                                            <SelectItem value="wedding">Wedding</SelectItem>
                                            <SelectItem value="ceremonial_introduction">Ceremonial Introduction</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.claim_type && <p className="text-sm text-red-600">{form.errors.claim_type}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="event_date">Event Date</Label>
                                    <Input
                                        id="event_date"
                                        type="date"
                                        value={form.data.event_date}
                                        onChange={(e) => form.setData('event_date', e.target.value)}
                                    />
                                    {form.errors.event_date && <p className="text-sm text-red-600">{form.errors.event_date}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
                                    <Input
                                        id="beneficiary_name"
                                        placeholder="Name of the person the support is for"
                                        value={form.data.beneficiary_name}
                                        onChange={(e) => form.setData('beneficiary_name', e.target.value)}
                                    />
                                    {form.errors.beneficiary_name && <p className="text-sm text-red-600">{form.errors.beneficiary_name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any additional notes..."
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? 'Submitting...' : 'Initiate Support'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search by member or beneficiary..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All statuses</SelectItem>
                                    <SelectItem value="initiated">Initiated</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={handleSearch}>
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Welfare Claims
                        </CardTitle>
                        <CardDescription>{claims.total} total claim{claims.total !== 1 ? 's' : ''}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {claims.data.length > 0 ? (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Beneficiary</TableHead>
                                            <TableHead>Event Date</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Yukon</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claims.data.map((claim) => (
                                            <TableRow key={claim.id}>
                                                <TableCell className="font-medium">
                                                    {claim.member.name}
                                                    <span className="ml-1 text-xs text-muted-foreground">(Cat {claim.member.savings_category})</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={claimTypeBadgeVariant[claim.claim_type] ?? 'secondary'}>
                                                        {claimTypeLabels[claim.claim_type] ?? claim.claim_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{claim.beneficiary_name}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(claim.event_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{formatEuros(claim.group_contribution)}</TableCell>
                                                <TableCell>{formatEuros(claim.yukon_contribution)}</TableCell>
                                                <TableCell className="font-semibold">{formatEuros(claim.total_payout)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={claim.status === 'paid' ? 'default' : 'secondary'}>
                                                        {claim.status === 'paid' ? 'Paid' : 'Initiated'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {claim.status === 'initiated' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(claim.id)}>
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    {claim.status === 'paid' && claim.paid_at && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(claim.paid_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination data={claims} />
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-medium">No welfare claims</h3>
                                <p className="mb-4 text-muted-foreground">No support has been initiated yet</p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Initiate Support
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
