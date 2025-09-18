import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    from: number;
    to: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    showPerPageSelector?: boolean;
    preserveState?: boolean;
    href?: string;
    buildUrl?: (page: number) => string;
}

export default function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    from,
    to,
    onPageChange,
    onPerPageChange,
    showPerPageSelector = false,
    preserveState = true,
    href,
    buildUrl,
}: PaginationProps) {
    if (lastPage <= 1) return null;

    // Calculate which page numbers to show
    const getVisiblePages = () => {
        const delta = 2; // Number of pages to show on each side of current page
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(lastPage - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < lastPage - 1) {
            rangeWithDots.push('...', lastPage);
        } else {
            if (lastPage > 1) {
                rangeWithDots.push(lastPage);
            }
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    const renderPageButton = (page: number | string, key: string) => {
        if (page === '...') {
            return (
                <span key={key} className="px-3 py-2 text-sm text-muted-foreground">
                    ...
                </span>
            );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        if (buildUrl && href) {
            return (
                <Link
                    key={key}
                    href={buildUrl(pageNum)}
                    preserveState={preserveState}
                >
                    <Button
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className={isActive ? '' : 'hover:bg-muted'}
                    >
                        {pageNum}
                    </Button>
                </Link>
            );
        }

        return (
            <Button
                key={key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isActive}
                className={isActive ? '' : 'hover:bg-muted'}
            >
                {pageNum}
            </Button>
        );
    };

    const renderNavigationButton = (
        page: number,
        disabled: boolean,
        icon: React.ReactNode,
        label: string
    ) => {
        if (buildUrl && href) {
            return (
                <Link
                    href={buildUrl(page)}
                    preserveState={preserveState}
                    className={disabled ? 'pointer-events-none opacity-50' : ''}
                >
                    <Button variant="outline" size="sm" disabled={disabled} title={label}>
                        {icon}
                    </Button>
                </Link>
            );
        }

        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={disabled}
                title={label}
            >
                {icon}
            </Button>
        );
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                    Showing {from} to {to} of {total} results
                </p>
                {showPerPageSelector && onPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Per page:</span>
                        <Select
                            value={perPage.toString()}
                            onValueChange={(value) => onPerPageChange(parseInt(value))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                {/* First page */}
                {renderNavigationButton(
                    1,
                    currentPage === 1,
                    <ChevronsLeft className="h-4 w-4" />,
                    'First page'
                )}

                {/* Previous page */}
                {renderNavigationButton(
                    currentPage - 1,
                    currentPage === 1,
                    <ChevronLeft className="h-4 w-4" />,
                    'Previous page'
                )}

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {visiblePages.map((page, index) =>
                        renderPageButton(page, `page-${index}`)
                    )}
                </div>

                {/* Next page */}
                {renderNavigationButton(
                    currentPage + 1,
                    currentPage === lastPage,
                    <ChevronRight className="h-4 w-4" />,
                    'Next page'
                )}

                {/* Last page */}
                {renderNavigationButton(
                    lastPage,
                    currentPage === lastPage,
                    <ChevronsRight className="h-4 w-4" />,
                    'Last page'
                )}
            </div>
        </div>
    );
}
