import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Save, Trash2, Users } from 'lucide-react';
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
    members: Array<{
        id: number;
        user: User;
        role: 'chairman' | 'secretary' | 'member';
    }>;
    created_at: string;
}

interface CommitteeEditProps {
    committee: Committee;
    availableUsers: User[];
}

const breadcrumbs = (committee: Committee): BreadcrumbItem[] => [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Committees', href: '/sacco/committees' },
    { title: committee.name, href: `/sacco/committees/${committee.id}` },
    { title: 'Edit', href: `/sacco/committees/${committee.id}/edit` },
];

export default function CommitteeEdit({ committee, availableUsers }: CommitteeEditProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const chairman = committee.members.find((m) => m.role === 'chairman');
    const secretary = committee.members.find((m) => m.role === 'secretary');

    const { data, setData, patch, processing, errors } = useForm({
        name: committee.name,
        description: committee.description || '',
        type: committee.type,
        status: committee.status,
        chairman_id: chairman?.user.id.toString() || '',
        secretary_id: secretary?.user.id.toString() || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/sacco/committees/${committee.id}`);
    };

    const handleDelete = () => {
        router.delete(`/sacco/committees/${committee.id}`, {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    const committeeTypes = [
        { value: 'management', label: 'Management Committee', description: 'Overall governance and strategic direction' },
        { value: 'loan_review', label: 'Loan Review Committee', description: 'Review and approve loan applications' },
        { value: 'audit', label: 'Audit Committee', description: 'Financial oversight and compliance' },
        { value: 'disciplinary', label: 'Disciplinary Committee', description: 'Handle member discipline and disputes' },
        { value: 'other', label: 'Other', description: 'Special purpose or custom committee' },
    ];

    const selectedType = committeeTypes.find((type) => type.value === data.type);

    return (
        <AppLayout breadcrumbs={breadcrumbs(committee)}>
            <Head title={`Edit ${committee.name} - Committee - SACCO`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/sacco/committees/${committee.id}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Committee
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Committee</h1>
                            <p className="text-muted-foreground">Update committee information and leadership</p>
                        </div>
                    </div>

                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Committee
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Committee Details
                                </CardTitle>
                                <CardDescription>Update committee information and leadership roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Committee Name *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., Management Committee"
                                                required
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status *</Label>
                                            <Select value={data.status} onValueChange={(value: 'active' | 'inactive') => setData('status', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Committee Type *</Label>
                                        <Select value={data.type} onValueChange={(value: typeof data.type) => setData('type', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select committee type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {committeeTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedType && <p className="text-sm text-muted-foreground">{selectedType.description}</p>}
                                        {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe the committee's purpose and responsibilities..."
                                            rows={4}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="chairman">Chairman</Label>
                                            <Select value={data.chairman_id} onValueChange={(value) => setData('chairman_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select chairman" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">No chairman</SelectItem>
                                                    {availableUsers.map((user) => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                    {/* Include current chairman even if not in available users */}
                                                    {chairman && !availableUsers.find((u) => u.id === chairman.user.id) && (
                                                        <SelectItem value={chairman.user.id.toString()}>{chairman.user.name} (current)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.chairman_id && <p className="text-sm text-red-600">{errors.chairman_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="secretary">Secretary</Label>
                                            <Select value={data.secretary_id} onValueChange={(value) => setData('secretary_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select secretary" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">No secretary</SelectItem>
                                                    {availableUsers
                                                        .filter((user) => user.id.toString() !== data.chairman_id)
                                                        .map((user) => (
                                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                                {user.name}
                                                            </SelectItem>
                                                        ))}
                                                    {/* Include current secretary even if not in available users */}
                                                    {secretary &&
                                                        !availableUsers.find((u) => u.id === secretary.user.id) &&
                                                        secretary.user.id.toString() !== data.chairman_id && (
                                                            <SelectItem value={secretary.user.id.toString()}>
                                                                {secretary.user.name} (current)
                                                            </SelectItem>
                                                        )}
                                                </SelectContent>
                                            </Select>
                                            {errors.secretary_id && <p className="text-sm text-red-600">{errors.secretary_id}</p>}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Link href={`/sacco/committees/${committee.id}`}>
                                            <Button variant="outline">Cancel</Button>
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Information Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Committee Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-medium text-foreground">Created</h4>
                                    <p className="mt-1 text-muted-foreground">{new Date(committee.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Current Members</h4>
                                    <p className="mt-1 text-muted-foreground">{committee.members.length} members</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Leadership Changes</h4>
                                    <p className="mt-1 text-muted-foreground">
                                        Updating leadership roles will automatically adjust member roles in the committee.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Current Members</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {committee.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{member.user.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                                {committee.members.length === 0 && <p className="text-sm text-muted-foreground">No members yet</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteDialog && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <Card className="mx-4 w-full max-w-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Delete Committee
                                </CardTitle>
                                <CardDescription>
                                    This action cannot be undone. All committee data and member associations will be permanently removed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {committee.members.length > 0 && (
                                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                                            <p className="text-sm text-yellow-800">
                                                This committee has {committee.members.length} member(s). Deleting it will remove all member
                                                associations.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="destructive" onClick={handleDelete} className="flex-1">
                                            Delete Committee
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
