import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Crown } from 'lucide-react';

interface OrganizationAdminWarningProps {
    userRole?: string;
    organizationCount?: number;
    className?: string;
}

export function OrganizationAdminWarning({ userRole, organizationCount = 0, className = '' }: OrganizationAdminWarningProps) {
    // Show warning if user is an admin
    if (userRole === 'admin') {
        return (
            <Alert variant="default" className={`border-orange-200 bg-orange-50 ${className}`}>
                <Crown className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Organization Admin</AlertTitle>
                <AlertDescription className="text-orange-700">
                    As an organization admin, you can only belong to one organization. You currently have admin privileges in this organization.
                </AlertDescription>
            </Alert>
        );
    }

    // Show info for members who might want to become admin elsewhere
    if (userRole === 'member' && organizationCount > 0) {
        return (
            <Alert variant="default" className={`border-blue-200 bg-blue-50 ${className}`}>
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Organization Membership</AlertTitle>
                <AlertDescription className="text-blue-700">
                    Note: If you become an admin of another organization, you'll need to leave this one first. Organization admins can only belong to
                    one organization at a time.
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}
