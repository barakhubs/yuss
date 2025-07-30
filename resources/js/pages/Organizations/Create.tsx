import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Update the path below to the correct location of your Textarea component
import { ArrowLeft } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Organizations',
    href: '/organizations',
  },
  {
    title: 'Create',
    href: '/organizations/create',
  },
];

export default function OrganizationsCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    website: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/organizations');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Organization" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/organizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Organization</h1>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Create a new organization to collaborate with your team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter organization name"
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                    placeholder="What does your organization do?"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={data.website}
                    onChange={(e) => setData('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Organization'}
                  </Button>
                  <Link href="/organizations">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
