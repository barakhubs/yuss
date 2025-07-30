import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface OrganizationWarningProps {
    organizationCount: number;
    userName: string;
}

export function OrganizationWarning({ organizationCount, userName }: OrganizationWarningProps) {
    if (organizationCount === 0) return null;

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Organization Membership Warning</AlertTitle>
            <AlertDescription>
                {userName} belongs to {organizationCount} organization(s). Promoting them to super admin will remove them from all organizations and
                transfer ownership of any organizations they own to other members (or delete them if no other members exist).
            </AlertDescription>
        </Alert>
    );
}
