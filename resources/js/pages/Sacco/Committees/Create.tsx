import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Users } from 'lucide-react';

interface CommitteeCreateProps {
    availableUsers: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Committees', href: '/sacco/committees' },
    { title: 'Create Committee', href: '/sacco/committees/create' },
];

export default function CommitteeCreate({ availableUsers }: CommitteeCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        type: 'other' as 'management' | 'loan_review' | 'audit' | 'disciplinary' | 'other',
        status: 'active' as 'active' | 'inactive',
        chairman_id: '',
        secretary_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sacco/committees');
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Committee - SACCO" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/sacco/committees">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Committees
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Committee</h1>
                        <p className="text-muted-foreground">Set up a new committee for your SACCO</p>
                    </div>
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
                                <CardDescription>Provide basic information about the committee</CardDescription>
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
                                            <Label htmlFor="chairman">Chairman (Optional)</Label>
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
                                                </SelectContent>
                                            </Select>
                                            {errors.chairman_id && <p className="text-sm text-red-600">{errors.chairman_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="secretary">Secretary (Optional)</Label>
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
                                                </SelectContent>
                                            </Select>
                                            {errors.secretary_id && <p className="text-sm text-red-600">{errors.secretary_id}</p>}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Creating...' : 'Create Committee'}
                                        </Button>
                                        <Link href="/sacco/committees">
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
                                <CardTitle className="text-lg">Committee Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-medium text-foreground">Naming Convention</h4>
                                    <p className="mt-1 text-muted-foreground">Use clear, descriptive names that indicate the committee's purpose.</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Leadership Roles</h4>
                                    <p className="mt-1 text-muted-foreground">
                                        Chairman leads meetings and makes final decisions. Secretary handles documentation and correspondence.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Committee Types</h4>
                                    <ul className="mt-1 space-y-1 text-muted-foreground">
                                        <li>
                                            • <strong>Management:</strong> Governance and strategy
                                        </li>
                                        <li>
                                            • <strong>Loan Review:</strong> Credit decisions
                                        </li>
                                        <li>
                                            • <strong>Audit:</strong> Financial oversight
                                        </li>
                                        <li>
                                            • <strong>Disciplinary:</strong> Member disputes
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium">Create Committee</p>
                                        <p className="text-muted-foreground">Set up basic committee information</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium">Add Members</p>
                                        <p className="text-muted-foreground">Invite members to join the committee</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium">Set Responsibilities</p>
                                        <p className="text-muted-foreground">Define roles and meeting schedules</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
