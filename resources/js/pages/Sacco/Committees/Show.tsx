import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, Clock, Edit, Mail, Plus, Shield, Star, User, UserCheck, UserMinus, Users } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface CommitteeMember {
    id: number;
    user: User;
    role: 'chairman' | 'secretary' | 'member';
    joined_at: string;
    notes?: string;
}

interface Committee {
    id: number;
    name: string;
    description: string;
    type: 'management' | 'loan_review' | 'audit' | 'disciplinary' | 'other';
    status: 'active' | 'inactive';
    members: CommitteeMember[];
    created_at: string;
    updated_at: string;
}

interface CommitteeShowProps {
    committee: Committee;
    availableUsers: User[];
    canEdit: boolean;
}

const breadcrumbs = (committee: Committee): BreadcrumbItem[] => [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Committees', href: '/sacco/committees' },
    { title: committee.name, href: `/sacco/committees/${committee.id}` },
];

export default function CommitteeShow({ committee, availableUsers, canEdit }: CommitteeShowProps) {
    const [showAddMember, setShowAddMember] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        role: 'member' as 'chairman' | 'secretary' | 'member',
        notes: '',
    });

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/sacco/committees/${committee.id}/members`, {
            onSuccess: () => {
                reset();
                setShowAddMember(false);
            },
        });
    };

    const handleRemoveMember = (memberId: number) => {
        if (confirm('Are you sure you want to remove this member from the committee?')) {
            router.delete(`/sacco/committees/${committee.id}/members/${memberId}`);
        }
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
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colors[type as keyof typeof colors] || colors.other}`}
            >
                {labels[type as keyof typeof labels] || type}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            active: 'default',
            inactive: 'secondary',
        } as const;

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-sm">
                {status}
            </Badge>
        );
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'chairman':
                return <Star className="h-4 w-4 text-yellow-500" />;
            case 'secretary':
                return <Shield className="h-4 w-4 text-blue-500" />;
            default:
                return <User className="h-4 w-4 text-gray-500" />;
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            chairman: 'bg-yellow-100 text-yellow-800',
            secretary: 'bg-blue-100 text-blue-800',
            member: 'bg-gray-100 text-gray-800',
        } as const;

        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colors[role as keyof typeof colors] || colors.member}`}
            >
                {getRoleIcon(role)}
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const chairman = committee.members.find((m) => m.role === 'chairman');
    const secretary = committee.members.find((m) => m.role === 'secretary');
    const regularMembers = committee.members.filter((m) => m.role === 'member');

    return (
        <AppLayout breadcrumbs={breadcrumbs(committee)}>
            <Head title={`${committee.name} - Committee - SACCO`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sacco/committees">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Committees
                            </Button>
                        </Link>
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{committee.name}</h1>
                                {getStatusBadge(committee.status)}
                            </div>
                            <p className="text-muted-foreground">{committee.description || 'No description provided'}</p>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex gap-2">
                            <Button onClick={() => setShowAddMember(true)} variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Member
                            </Button>
                            <Link href={`/sacco/committees/${committee.id}/edit`}>
                                <Button>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Committee
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Committee Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Committee Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Type</label>
                                <div className="mt-1">{getTypeBadge(committee.type)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">{getStatusBadge(committee.status)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Total Members</label>
                                <div className="mt-1 text-2xl font-bold">{committee.members.length}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created</label>
                                <div className="mt-1 flex items-center gap-1 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(committee.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5" />
                                Leadership
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Chairman</label>
                                {chairman ? (
                                    <div className="mt-1">
                                        <div className="font-medium">{chairman.user.name}</div>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {chairman.user.email}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                        <AlertCircle className="h-4 w-4" />
                                        No chairman assigned
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Secretary</label>
                                {secretary ? (
                                    <div className="mt-1">
                                        <div className="font-medium">{secretary.user.name}</div>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {secretary.user.email}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                        <AlertCircle className="h-4 w-4" />
                                        No secretary assigned
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Membership Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Leadership Roles</label>
                                <div className="mt-1 text-2xl font-bold">{(chairman ? 1 : 0) + (secretary ? 1 : 0)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Regular Members</label>
                                <div className="mt-1 text-2xl font-bold">{regularMembers.length}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Latest Addition</label>
                                <div className="mt-1 flex items-center gap-1 text-sm">
                                    <Clock className="h-4 w-4" />
                                    {committee.members.length > 0
                                        ? new Date(Math.max(...committee.members.map((m) => new Date(m.joined_at).getTime()))).toLocaleDateString()
                                        : 'No members yet'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Committee Members</CardTitle>
                        <CardDescription>{committee.members.length} members in this committee</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Notes</TableHead>
                                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {committee.members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{member.user.name}</div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {member.user.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{member.notes || '-'}</TableCell>
                                        {canEdit && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                                                        <UserMinus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {committee.members.length === 0 && (
                            <div className="py-8 text-center">
                                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No members in this committee yet.</p>
                                {canEdit && (
                                    <Button className="mt-4" onClick={() => setShowAddMember(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add First Member
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Member Form */}
                {showAddMember && canEdit && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Member</CardTitle>
                            <CardDescription>Add a new member to this committee</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Member *</label>
                                        <select
                                            value={data.user_id}
                                            onChange={(e) => setData('user_id', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                            required
                                        >
                                            <option value="">Select a member...</option>
                                            {availableUsers.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.user_id && <p className="text-sm text-red-600">{errors.user_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Role *</label>
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value as 'chairman' | 'secretary' | 'member')}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                            required
                                        >
                                            <option value="member">Member</option>
                                            <option value="secretary">Secretary</option>
                                            <option value="chairman">Chairman</option>
                                        </select>
                                        {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes</label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Optional notes about this member's role or responsibilities..."
                                        rows={3}
                                    />
                                    {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Adding...' : 'Add Member'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
