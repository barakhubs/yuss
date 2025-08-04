import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
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
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Check for any flash message - only depend on flash changes
        if (flash.success) {
            setMessage({ type: 'success', text: flash.success });
            setVisible(true);
            setIsAnimating(true);
        } else if (flash.error) {
            setMessage({ type: 'error', text: flash.error });
            setVisible(true);
            setIsAnimating(true);
        } else if (flash.info) {
            setMessage({ type: 'info', text: flash.info });
            setVisible(true);
            setIsAnimating(true);
        } else if (flash.warning) {
            setMessage({ type: 'warning', text: flash.warning });
            setVisible(true);
            setIsAnimating(true);
        }
    }, [flash]);

    useEffect(() => {
        // Auto-hide after 5 seconds - separate effect for timer
        if (visible && message) {
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [visible, message]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setVisible(false);
            setMessage(null);
        }, 300); // Wait for animation to complete
    };

    if (!visible || !message) {
        return null;
    }

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <X className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-amber-500" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    const getBorderColor = () => {
        switch (message.type) {
            case 'success':
                return 'border-l-green-500';
            case 'error':
                return 'border-l-red-500';
            case 'warning':
                return 'border-l-amber-500';
            case 'info':
                return 'border-l-blue-500';
            default:
                return 'border-l-gray-500';
        }
    };

    return (
        <div
            className={`fixed top-6 right-6 w-80 transform transition-all duration-300 ease-in-out ${
                isAnimating ? 'translate-x-0 scale-100 opacity-100' : 'translate-x-full scale-95 opacity-0'
            }`}
            style={{ zIndex: 9999 }}
        >
            <div className={`rounded-lg border border-gray-200 bg-white shadow-xl ${getBorderColor()} border-l-4 p-4`}>
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed font-medium text-gray-900">{message.text}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="ml-2 flex-shrink-0 rounded-md p-1 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close notification"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
