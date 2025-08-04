/**
 * Format a number as Euro currency
 */
export function formatEuros(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numAmount);
}

/**
 * Parse a currency string to number (removes € symbol and formatting)
 */
export function parseEuros(currencyString: string): number {
    return parseFloat(currencyString.replace(/[€,\s]/g, ''));
}

/**
 * Format a number as Euro without currency symbol (for inputs)
 */
export function formatEurosPlain(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('en-IE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numAmount);
}
