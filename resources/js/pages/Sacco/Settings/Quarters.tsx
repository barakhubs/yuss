import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, CheckCircle, Circle, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

interface Quarter {
    id: number;
    quarter_number: number;
    year: number;
    status: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface QuartersProps {
    quarters: {
        data: Quarter[];
    } & PaginationData;
}

export default function Quarters({ quarters }: QuartersProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const createForm = useForm({
        quarter_number: '',
        year: new Date().getFullYear().toString(),
    });

    const handleActivate = (quarter: Quarter) => {
        router.patch(
            route('sacco.settings.quarters.activate', quarter.id),
            {},
            {
                onSuccess: () => {
                    // Success handled by flash message
                },
            },
        );
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('sacco.settings.quarters.store'), {
            onSuccess: () => {
                setShowCreateDialog(false);
                createForm.reset();
            },
        });
    };

    const getQuarterName = (quarter: Quarter) => {
        return `Q${quarter.quarter_number} ${quarter.year}`;
    };

    const getQuarterMonths = (quarterNumber: number) => {
        const quarterMonths = {
            1: 'January - April',
            2: 'May - August',
            3: 'September - December',
        };
        return quarterMonths[quarterNumber as keyof typeof quarterMonths] || 'Unknown';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'SACCO', href: '/' },
        { title: 'Quarter Settings', href: '/sacco/settings/quarters' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quarter Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quarter Management</h1>
                        <p className="text-muted-foreground">Manage SACCO operational quarters and set the active quarter</p>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Quarter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Quarter</DialogTitle>
                                <DialogDescription>Add a new operational quarter for the SACCO</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="quarter_number">Quarter</Label>
                                        <Select
                                            value={createForm.data.quarter_number}
                                            onValueChange={(value) => createForm.setData('quarter_number', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select quarter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Q1 (January - April)</SelectItem>
                                                <SelectItem value="2">Q2 (May - August)</SelectItem>
                                                <SelectItem value="3">Q3 (September - December)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {createForm.errors.quarter_number && (
                                            <p className="text-sm text-red-600">{createForm.errors.quarter_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="year">Year</Label>
                                        <Select value={createForm.data.year} onValueChange={(value) => createForm.setData('year', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {years.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {createForm.errors.year && <p className="text-sm text-red-600">{createForm.errors.year}</p>}
                                    </div>
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createForm.processing}>
                                        {createForm.processing ? 'Creating...' : 'Create Quarter'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Quarter Information
                        </CardTitle>
                        <CardDescription>
                            Quarters represent operational periods for the SACCO. Only one quarter can be active at a time. All savings and loan
                            activities are tied to the active quarter.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Quarters Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Available Quarters
                        </CardTitle>
                        <CardDescription>Click "Set Active" to make a quarter the current operational period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {quarters.data.length > 0 ? (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Quarter</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quarters.data.map((quarter) => (
                                            <TableRow key={quarter.id}>
                                                <TableCell className="font-medium">{getQuarterName(quarter)}</TableCell>
                                                <TableCell className="text-muted-foreground">{getQuarterMonths(quarter.quarter_number)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={quarter.status === 'active' ? 'default' : 'secondary'}>
                                                        {quarter.status === 'active' ? (
                                                            <>
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Circle className="mr-1 h-3 w-3" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {quarter.status !== 'active' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleActivate(quarter)}>
                                                            Set Active
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination data={quarters} />
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-medium">No quarters found</h3>
                                <p className="mb-4 text-muted-foreground">Create your first quarter to start managing SACCO operations</p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Quarter
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
