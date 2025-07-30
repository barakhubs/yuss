import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Send, UserPlus } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
}

interface InvitationCreateProps {
    organization: Organization;
}

export default function InvitationCreate({ organization }: InvitationCreateProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Organizations',
            href: '/organizations',
        },
        {
            title: organization.name,
            href: `/organizations/${organization.slug}`,
        },
        {
            title: 'Invite Member',
            href: `/organizations/${organization.slug}/invitations/create`,
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        role: 'member',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/organizations/${organization.slug}/invitations`, {
            preserveScroll: true,
            onSuccess: () => {
                // Reset form on success
                setData({
                    email: '',
                    role: 'member',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invite Member - ${organization.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-bold">Invite Team Member</h1>
                        <p className="text-muted-foreground">Invite someone to join {organization.name}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Send Invitation
                                </CardTitle>
                                <CardDescription>Enter the email address and role for the person you'd like to invite</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="colleague@company.com"
                                            className={errors.email ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                        <p className="text-sm text-muted-foreground">We'll send an invitation link to this email address</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="member">Member</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                                        <p className="text-sm text-muted-foreground">Choose the level of access for this team member</p>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            <Send className="mr-2 h-4 w-4" />
                                            {processing ? 'Sending...' : 'Send Invitation'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Role Permissions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Role Permissions</CardTitle>
                                <CardDescription>What each role can do in your organization</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium">Member</h4>
                                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                        <li>• View organization details</li>
                                        <li>• Access shared resources</li>
                                        <li>• Collaborate with team</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Admin</h4>
                                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                        <li>• All member permissions</li>
                                        <li>• Invite and remove members</li>
                                        <li>• Manage organization settings</li>
                                        <li>• View billing information</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Owner</h4>
                                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                        <li>• All admin permissions</li>
                                        <li>• Manage billing and subscriptions</li>
                                        <li>• Delete organization</li>
                                        <li>• Transfer ownership</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    <strong>Double-check the email:</strong> Invitations are sent immediately and can't be edited.
                                </p>
                                <p>
                                    <strong>Invitation expiry:</strong> Invitations expire after 7 days for security.
                                </p>
                                <p>
                                    <strong>Role changes:</strong> You can change a member's role after they join.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
