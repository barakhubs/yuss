import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Building, Save, Trash2 } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface OrganizationEditProps {
    organization: Organization;
}

export default function OrganizationEdit({ organization }: OrganizationEditProps) {
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
            title: 'Settings',
            href: `/organizations/${organization.slug}/edit`,
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: organization.name,
        description: organization.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/organizations/${organization.slug}`, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
            router.delete(`/organizations/${organization.slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${organization.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-bold">Organization Settings</h1>
                        <p className="text-muted-foreground">Manage your organization details and settings</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Settings */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization Details</CardTitle>
                                <CardDescription>Update your organization's basic information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Organization Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter organization name"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter organization description (optional)"
                                            rows={4}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Organization Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Organization Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Organization ID</Label>
                                    <p className="font-mono">{organization.id}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Slug</Label>
                                    <p className="font-mono">{organization.slug}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription className="text-red-600">Irreversible and destructive actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-red-900">Delete Organization</h4>
                                        <p className="mb-3 text-sm text-red-700">
                                            Once you delete an organization, there is no going back. Please be certain.
                                        </p>
                                        <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Organization
                                        </Button>
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
