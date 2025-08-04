import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PaginationProps {
    data: PaginationData;
    preserveState?: boolean;
    preserveScroll?: boolean;
    className?: string;
    showInfo?: boolean;
}

export function Pagination({ data, preserveState = true, preserveScroll = true, className, showInfo = true }: PaginationProps) {
    const currentUrl = new URL(window.location.href);

    const navigate = (page: number) => {
        currentUrl.searchParams.set('page', page.toString());

        router.get(
            currentUrl.toString(),
            {},
            {
                preserveState,
                preserveScroll,
            },
        );
    };

    const generatePageNumbers = () => {
        const { current_page, last_page } = data;
        const pages: (number | string)[] = [];

        // Always show first page
        pages.push(1);

        if (current_page > 4) {
            pages.push('...');
        }

        // Show pages around current page
        const start = Math.max(2, current_page - 1);
        const end = Math.min(last_page - 1, current_page + 1);

        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        if (current_page < last_page - 3) {
            pages.push('...');
        }

        // Always show last page (if more than 1 page)
        if (last_page > 1 && !pages.includes(last_page)) {
            pages.push(last_page);
        }

        return pages;
    };

    // Don't show pagination if there's only one page
    if (data.last_page <= 1) {
        return null;
    }

    return (
        <div className={cn('flex items-center justify-between', className)}>
            {showInfo && (
                <div className="text-sm text-muted-foreground">
                    Showing {data.from} to {data.to} of {data.total} results
                </div>
            )}

            <div className="flex items-center space-x-1">
                {/* Previous button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(data.current_page - 1)}
                    disabled={data.current_page <= 1}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {generatePageNumbers().map((page, index) => (
                    <Button
                        key={index}
                        variant={page === data.current_page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => (typeof page === 'number' ? navigate(page) : undefined)}
                        disabled={typeof page === 'string'}
                        className="h-8 w-8 p-0"
                    >
                        {typeof page === 'string' ? <MoreHorizontal className="h-4 w-4" /> : page}
                    </Button>
                ))}

                {/* Next button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(data.current_page + 1)}
                    disabled={data.current_page >= data.last_page}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
