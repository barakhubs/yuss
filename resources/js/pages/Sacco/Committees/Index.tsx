import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck, Clock, Edit, Eye, Filter, Plus, Search, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Committee {
    id: number;
    name: string;
    description: string;
    type: 'management' | 'loan_review' | 'audit' | 'disciplinary' | 'other';
    status: 'active' | 'inactive';
    members_count: number;
    chairman?: User;
    secretary?: User;
    created_at: string;
    updated_at: string;
}

interface CommitteeIndexProps {
    committees: {
        data: Committee[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters?: {
        search?: string;
        status?: string;
        type?: string;
    };
    statistics: {
        total_committees: number;
        active_committees: number;
        total_members: number;
        committees_by_type: Record<string, number>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Committees', href: '/sacco/committees' },
];

export default function CommitteeIndex({ committees, filters = {}, statistics }: CommitteeIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get(
            '/sacco/committees',
            {
                search: searchTerm || undefined,
                status: statusFilter || undefined,
                type: typeFilter || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setTypeFilter('');
        router.get(
            '/sacco/committees',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            active: 'default',
            inactive: 'secondary',
        } as const;

        return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
    };

    const getTypeBadge = (type: string) => {
        const colors = {
            management: 'bg-blue-100 text-blue-800',
            loan_review: 'bg-green-100 text-green-800',
            audit: 'bg-purple-100 text-purple-800',
            disciplinary: 'bg-red-100 text-red-800',
            other: 'bg-gray-100 text-gray-800',
        } as const;

        const labels = {
            management: 'Management',
            loan_review: 'Loan Review',
            audit: 'Audit',
            disciplinary: 'Disciplinary',
            other: 'Other',
        } as const;

        return (
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type as keyof typeof colors] || colors.other}`}
            >
                {labels[type as keyof typeof labels] || type}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Committees - SACCO" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Committees</h1>
                        <p className="text-muted-foreground">Manage SACCO committees and their members</p>
                    </div>

                    <Link href="/sacco/committees/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Committee
                        </Button>
                    </Link>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Committees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_committees}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Committees</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.active_committees}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.total_committees > 0 ? Math.round((statistics.active_committees / statistics.total_committees) * 100) : 0}
                                % of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Committee Members</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_members}</div>
                            <p className="text-xs text-muted-foreground">Across all committees</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.entries(statistics.committees_by_type).sort(([, a], [, b]) => b - a)[0]?.[1] || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {Object.entries(statistics.committees_by_type).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Committees</CardTitle>
                                <CardDescription>{committees.total} total committees</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {showFilters && (
                            <div className="mb-6 grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search committees..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All types</SelectItem>
                                            <SelectItem value="management">Management</SelectItem>
                                            <SelectItem value="loan_review">Loan Review</SelectItem>
                                            <SelectItem value="audit">Audit</SelectItem>
                                            <SelectItem value="disciplinary">Disciplinary</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>&nbsp;</Label>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSearch} className="flex-1">
                                            Apply
                                        </Button>
                                        <Button onClick={clearFilters} variant="outline">
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Committee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Leadership</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {committees.data.map((committee) => (
                                    <TableRow key={committee.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{committee.name}</div>
                                                {committee.description && (
                                                    <div className="line-clamp-1 text-sm text-muted-foreground">{committee.description}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(committee.type)}</TableCell>
                                        <TableCell>{getStatusBadge(committee.status)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{committee.members_count} members</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {committee.chairman && (
                                                    <div className="text-sm">
                                                        <span className="font-medium">Chair:</span> {committee.chairman.name}
                                                    </div>
                                                )}
                                                {committee.secretary && (
                                                    <div className="text-sm">
                                                        <span className="font-medium">Secretary:</span> {committee.secretary.name}
                                                    </div>
                                                )}
                                                {!committee.chairman && !committee.secretary && (
                                                    <span className="text-sm text-muted-foreground">No leadership assigned</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(committee.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/sacco/committees/${committee.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/sacco/committees/${committee.id}/edit`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {committees.data.length === 0 && (
                            <div className="py-8 text-center">
                                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {searchTerm || statusFilter || typeFilter
                                        ? 'No committees found matching your criteria.'
                                        : 'No committees found. Create your first committee to get started.'}
                                </p>
                                {!searchTerm && !statusFilter && !typeFilter && (
                                    <Link href="/sacco/committees/create">
                                        <Button className="mt-4">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Committee
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {committees.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(committees.current_page - 1) * committees.per_page + 1} to{' '}
                                    {Math.min(committees.current_page * committees.per_page, committees.total)} of {committees.total} committees
                                </div>
                                <div className="flex items-center gap-2">
                                    {committees.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
