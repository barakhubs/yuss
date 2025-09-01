import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import { LogOut, User } from 'lucide-react';

interface ImpersonationData {
    is_impersonating: boolean;
    impersonator: {
        id: number;
        name: string;
        email: string;
    } | null;
    impersonated_user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface PageProps {
    impersonation?: ImpersonationData;
    [key: string]: unknown;
}

export default function ImpersonationBanner() {
    const { props } = usePage<PageProps>();
    const impersonation = props.impersonation;

    if (!impersonation?.is_impersonating) {
        return null;
    }

    const handleStopImpersonating = () => {
        router.post(route('sacco.members.stop-impersonating'));
    };

    return (
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
            <User className="h-4 w-4" />
            <AlertDescription className="flex w-full items-center justify-between">
                <span>
                    You are currently impersonating <strong>{impersonation.impersonated_user?.name}</strong>
                    {impersonation.impersonator && <span className="text-sm"> (logged in as {impersonation.impersonator.name})</span>}
                </span>
                <Button onClick={handleStopImpersonating} variant="outline" size="sm" className="ml-4">
                    <LogOut className="mr-2 h-4 w-4" />
                    Stop Impersonating
                </Button>
            </AlertDescription>
        </Alert>
    );
}
