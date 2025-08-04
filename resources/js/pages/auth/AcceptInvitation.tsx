import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface User {
    name: string;
    email: string;
    role: string;
}

interface AcceptInvitationProps {
    token: string;
    user: User;
}

export default function AcceptInvitation({ token, user }: AcceptInvitationProps) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('invitation.complete', token));
    };

    return (
        <AuthLayout title="Accept Invitation" description="Complete your account setup to join the SACCO">
            <Head title="Accept Invitation" />

            <Card className="mx-auto w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome to the SACCO!</CardTitle>
                    <CardDescription>
                        You have been invited to join as a <strong>{user.role}</strong>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="space-y-1 text-sm text-blue-800">
                            <p>
                                <strong>Name:</strong> {user.name}
                            </p>
                            <p>
                                <strong>Email:</strong> {user.email}
                            </p>
                            <p>
                                <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="new-password"
                                autoFocus
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation}</p>}
                        </div>

                        <div className="text-sm text-gray-600">
                            <p className="mb-1 font-medium">Password requirements:</p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>At least 8 characters long</li>
                                <li>Must contain letters and numbers</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing ? 'Setting up your account...' : 'Complete Account Setup'}
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">After setting up your password, you'll be logged in and redirected to the dashboard.</p>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
