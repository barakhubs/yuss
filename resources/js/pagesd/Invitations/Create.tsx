import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Mail, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_verified: boolean;
}

interface PageProps {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CreateInvitation({ flash }: PageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        first_name: '',
        last_name: '',
        role: 'member',
    });

    const [showForm, setShowForm] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('invitations.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const roleOptions = [
        { value: 'secretary', label: 'Secretary' },
        { value: 'treasurer', label: 'Treasurer' },
        { value: 'disburser', label: 'Disburser' },
        { value: 'member', label: 'Member' },
    ];

    return (
        <AppLayout>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">Invite new members to join the SACCO</p>
                    </div>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite User
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <Alert>
                        <AlertDescription className="text-green-700">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {showForm ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invite New User</CardTitle>
                            <CardDescription>Send an invitation to a new member to join the SACCO</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            type="text"
                                            name="first_name"
                                            value={data.first_name}
                                            autoComplete="given-name"
                                            autoFocus
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('first_name', e.target.value)}
                                            required
                                        />
                                        {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            type="text"
                                            name="last_name"
                                            value={data.last_name}
                                            autoComplete="family-name"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('last_name', e.target.value)}
                                            required
                                        />
                                        {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="email"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                                    <p className="text-sm text-muted-foreground">
                                        Select the role for this user. Committee members have additional privileges.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        {processing ? 'Sending Invitation...' : 'Send Invitation'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowForm(false);
                                            reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invitation Information</CardTitle>
                            <CardDescription>As the chairperson, you can invite new members to join the SACCO</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Each invited user will receive an email with instructions to set up their account.
                            </p>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <h4 className="mb-2 font-medium text-blue-900">Available Roles:</h4>
                                <ul className="space-y-1 text-sm text-blue-800">
                                    <li>
                                        <strong>Secretary:</strong> Manages records and documentation
                                    </li>
                                    <li>
                                        <strong>Treasurer:</strong> Manages finances and savings
                                    </li>
                                    <li>
                                        <strong>Disburser:</strong> Handles loan disbursements
                                    </li>
                                    <li>
                                        <strong>Member:</strong> Regular SACCO member with standard access
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
