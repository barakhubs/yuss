import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Crown, Plus, Users } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    description?: string;
    owner: {
        id: number;
        name: string;
    };
    users_count?: number;
    created_at: string;
}

interface Props {
    organizations: Organization[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizations',
        href: '/organizations',
    },
];

export default function OrganizationsIndex({ organizations }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizations" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Organizations</h1>
                        {organizations.length > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">You can only belong to one organization at a time</p>
                        )}
                    </div>
                    {organizations.length === 0 && (
                        <Link href="/organizations/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Organization
                            </Button>
                        </Link>
                    )}
                </div>

                {organizations.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                                <Users className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No organizations yet</h3>
                            <p className="mb-6 text-gray-500">Get started by creating your first organization.</p>
                            <Link href="/organizations/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Organization
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {organizations.map((organization) => (
                            <Card key={organization.id} className="transition-shadow hover:shadow-lg">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {organization.name}
                                                {organization.owner.id === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                                            </CardTitle>
                                            <CardDescription>{organization.description || 'No description'}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Users className="mr-1 h-4 w-4" />
                                            {organization.users_count || 0} members
                                        </div>
                                        <div className="text-sm text-gray-500">Owner: {organization.owner.name}</div>
                                        <div className="text-sm text-gray-500">Created: {new Date(organization.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link href={`/organizations/${organization.slug}`} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                View
                                            </Button>
                                        </Link>
                                        <Link href={`/organizations/${organization.slug}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                Edit
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
