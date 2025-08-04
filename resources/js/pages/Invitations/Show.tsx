import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building, CheckCircle, Clock, Mail, XCircle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    expires_at: string;
    created_at: string;
    token: string;
}

interface InvitationShowProps {
    invitation: Invitation;
    inviter: User;
}

export default function InvitationShow({ invitation, inviter }: InvitationShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'SACCO Invitation',
            href: `/invitations/${invitation.token}`,
        },
    ];

    const handleAccept = () => {
        router.post(`/invitations/${invitation.token}/accept`);
    };

    const handleDecline = () => {
        router.post(`/invitations/${invitation.token}/decline`);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadge = (role: string) => {
        const roleConfig = {
            owner: { variant: 'default' as const, label: 'Owner' },
            admin: { variant: 'secondary' as const, label: 'Admin' },
            member: { variant: 'outline' as const, label: 'Member' },
        };

        const config = roleConfig[role as keyof typeof roleConfig] || {
            variant: 'outline' as const,
            label: role.charAt(0).toUpperCase() + role.slice(1),
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const isExpired = new Date(invitation.expires_at) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SACCO Invitation" />
            <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">You're Invited!</h1>
                        <p className="text-muted-foreground">Join our SACCO and start saving and lending with your community</p>
                    </div>

                    {/* Invitation Card */}
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Building className="h-5 w-5" />
                                SACCO Community
                            </CardTitle>
                            <CardDescription>Savings and Credit Cooperative Organization</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Invitation Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Role:</span>
                                    {getRoleBadge(invitation.role)}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Invited by:</span>
                                    <span className="text-sm font-medium">{inviter.name}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Invited on:</span>
                                    <span className="text-sm">{formatDate(invitation.created_at)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Expires:</span>
                                    <span className={`text-sm ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                                        {formatDate(invitation.expires_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Status & Actions */}
                            {isExpired ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-800">This invitation has expired</span>
                                    </div>
                                    <p className="text-center text-sm text-muted-foreground">Please contact {inviter.name} for a new invitation.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                                        <Clock className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Invitation is valid</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" onClick={handleDecline} className="w-full">
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Decline
                                        </Button>
                                        <Button onClick={handleAccept} className="w-full">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Accept
                                        </Button>
                                    </div>

                                    <p className="text-center text-xs text-muted-foreground">
                                        By accepting, you'll be added to the SACCO with {invitation.role} permissions.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Don't recognize this invitation? You can safely ignore this email.</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
