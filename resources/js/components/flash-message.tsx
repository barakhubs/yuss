import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function FlashMessage() {
    const props = usePage().props as Record<string, unknown>;
    const flash = useMemo(() => {
        const flashData = (props.flash as Record<string, string | null | undefined>) || {};
        return {
            success: flashData.success || null,
            error: flashData.error || null,
            info: flashData.info || null,
            warning: flashData.warning || null,
        };
    }, [props.flash]);

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

    useEffect(() => {
        // Check for any flash message
        if (flash.success) {
            setMessage({ type: 'success', text: flash.success });
            setVisible(true);
        } else if (flash.error) {
            setMessage({ type: 'error', text: flash.error });
            setVisible(true);
        } else if (flash.info) {
            setMessage({ type: 'info', text: flash.info });
            setVisible(true);
        } else if (flash.warning) {
            setMessage({ type: 'warning', text: flash.warning });
            setVisible(true);
        }

        // Auto-hide after 5 seconds
        if (visible) {
            const timer = setTimeout(() => {
                setVisible(false);
                setMessage(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [flash, visible]);

    if (!visible || !message) {
        return null;
    }

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return <CheckCircle className="h-4 w-4" />;
            case 'error':
                return <XCircle className="h-4 w-4" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4" />;
            case 'info':
                return <Info className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getVariant = () => {
        switch (message.type) {
            case 'error':
                return 'destructive';
            default:
                return 'default';
        }
    };

    const getClassName = () => {
        const baseClasses = 'mb-4';
        switch (message.type) {
            case 'success':
                return `${baseClasses} border-green-200 bg-green-50 text-green-800`;
            case 'error':
                return `${baseClasses} border-red-200 bg-red-50 text-red-800`;
            case 'warning':
                return `${baseClasses} border-yellow-200 bg-yellow-50 text-yellow-800`;
            case 'info':
                return `${baseClasses} border-blue-200 bg-blue-50 text-blue-800`;
            default:
                return baseClasses;
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md">
            <Alert variant={getVariant()} className={getClassName()}>
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <AlertDescription className="flex-1">{message.text}</AlertDescription>
                    <button
                        onClick={() => {
                            setVisible(false);
                            setMessage(null);
                        }}
                        className="text-current opacity-70 hover:opacity-100"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            </Alert>
        </div>
    );
}
