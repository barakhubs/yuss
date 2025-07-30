import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PlanFeature {
    id?: number;
    name: string;
    slug: string;
    type: 'boolean' | 'limit' | 'text';
    value: string;
    description?: string;
}

export default function SuperAdminPlanCreate() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
        {
            title: 'Plans',
            href: '/super-admin/plans',
        },
        {
            title: 'Create Plan',
            href: '/super-admin/plans/create',
        },
    ];

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        billing_period: 'monthly',
        stripe_price_id: '',
        is_active: true,
        is_featured: false,
        sort_order: '0',
    });

    const [features, setFeatures] = useState<PlanFeature[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [newFeature, setNewFeature] = useState<PlanFeature>({
        name: '',
        slug: '',
        type: 'boolean',
        value: '1',
        description: '',
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (value: string) => {
        setFormData({
            ...formData,
            name: value,
            slug: formData.slug === '' ? generateSlug(value) : formData.slug,
        });
    };

    const handleFeatureNameChange = (value: string) => {
        setNewFeature({
            ...newFeature,
            name: value,
            slug: newFeature.slug === '' ? generateSlug(value) : newFeature.slug,
        });
    };

    const handleFeatureTypeChange = (type: 'boolean' | 'limit' | 'text') => {
        let defaultValue = '1';
        if (type === 'limit') defaultValue = '10';
        if (type === 'text') defaultValue = '';

        setNewFeature({
            ...newFeature,
            type,
            value: defaultValue,
        });
    };

    const addFeature = () => {
        if (newFeature.name && newFeature.slug) {
            setFeatures([...features, { ...newFeature }]);
            setNewFeature({
                name: '',
                slug: '',
                type: 'boolean',
                value: '1',
                description: '',
            });
        }
    };

    const removeFeature = (index: number) => {
        const updatedFeatures = features.filter((_, i) => i !== index);
        setFeatures(updatedFeatures);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const submitData = {
            ...formData,
            features: features.map((feature) => ({
                name: feature.name,
                slug: feature.slug,
                type: feature.type,
                value: feature.value,
                description: feature.description || '',
            })),
        };

        router.post('/super-admin/plans', submitData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Plan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <h1 className="text-2xl font-bold">Create New Plan</h1>
                            <p className="text-muted-foreground">Create a new subscription plan with features</p>
                        </div>
                    </div>
                    <Link href="/super-admin/plans">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Plans
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Plan Details */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Information</CardTitle>
                                    <CardDescription>Basic details about this subscription plan</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Plan Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                placeholder="e.g., Pro Plan"
                                                className={errors.name ? 'border-red-500' : ''}
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug *</Label>
                                            <Input
                                                id="slug"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                placeholder="e.g., pro-plan"
                                                className={errors.slug ? 'border-red-500' : ''}
                                            />
                                            {errors.slug && <p className="text-sm text-red-600">{errors.slug}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of the plan"
                                            rows={3}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Price (in cents) *</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="e.g., 2999 for $29.99"
                                                className={errors.price ? 'border-red-500' : ''}
                                            />
                                            {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billing_period">Billing Period *</Label>
                                            <Select
                                                value={formData.billing_period}
                                                onValueChange={(value) => setFormData({ ...formData, billing_period: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                                        <Input
                                            id="stripe_price_id"
                                            value={formData.stripe_price_id}
                                            onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                                            placeholder="e.g., price_1234567890"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sort_order">Sort Order</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Features */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Features</CardTitle>
                                    <CardDescription>Define what's included in this plan</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Existing Features */}
                                    {features.length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Current Features</Label>
                                            <div className="space-y-2">
                                                {features.map((feature, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                        <div>
                                                            <p className="font-medium">{feature.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {feature.type}: {feature.value}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFeature(index)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add New Feature */}
                                    <div className="space-y-4 rounded-lg border-2 border-dashed p-4">
                                        <Label>Add Feature</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="feature_name">Feature Name</Label>
                                                <Input
                                                    id="feature_name"
                                                    value={newFeature.name}
                                                    onChange={(e) => handleFeatureNameChange(e.target.value)}
                                                    placeholder="e.g., Max Users"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="feature_slug">Feature Slug</Label>
                                                <Input
                                                    id="feature_slug"
                                                    value={newFeature.slug}
                                                    onChange={(e) => setNewFeature({ ...newFeature, slug: e.target.value })}
                                                    placeholder="e.g., max-users"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="feature_type">Feature Type</Label>
                                                <Select value={newFeature.type} onValueChange={handleFeatureTypeChange}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                                                        <SelectItem value="limit">Limit (Number)</SelectItem>
                                                        <SelectItem value="text">Text Value</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="feature_value">Value</Label>
                                                {newFeature.type === 'boolean' ? (
                                                    <Select
                                                        value={newFeature.value}
                                                        onValueChange={(value) => setNewFeature({ ...newFeature, value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">Yes</SelectItem>
                                                            <SelectItem value="0">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : newFeature.type === 'limit' ? (
                                                    <Input
                                                        type="number"
                                                        value={newFeature.value}
                                                        onChange={(e) => setNewFeature({ ...newFeature, value: e.target.value })}
                                                        placeholder="e.g., 10 or -1 for unlimited"
                                                    />
                                                ) : (
                                                    <Input
                                                        value={newFeature.value}
                                                        onChange={(e) => setNewFeature({ ...newFeature, value: e.target.value })}
                                                        placeholder="Enter text value"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="feature_description">Description</Label>
                                            <Input
                                                id="feature_description"
                                                value={newFeature.description}
                                                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                                                placeholder="Optional description"
                                            />
                                        </div>

                                        <Button type="button" variant="outline" onClick={addFeature} disabled={!newFeature.name || !newFeature.slug}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Feature
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Plan Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                                        />
                                        <Label htmlFor="is_active">Active Plan</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Only active plans are visible to customers</p>

                                    <Separator />

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_featured"
                                            checked={formData.is_featured}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: !!checked })}
                                        />
                                        <Label htmlFor="is_featured">Featured Plan</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Featured plans are highlighted to customers</p>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Plan'}
                                    </Button>
                                    <Link href="/super-admin/plans" className="block">
                                        <Button variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
