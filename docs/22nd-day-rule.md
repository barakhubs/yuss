# SACCO Loan Repayment - 22nd Day Rule

## Overview

The SACCO system implements a "22nd day rule" for loan repayments to provide flexibility for borrowers while maintaining predictable cash flow.

## Rule Definition

- **Loans taken before the 22nd of any month** can be repaid within that same month (end of month)
- **Loans taken on or after the 22nd of any month** must be repaid in the following month (end of next month)

## Examples

### 1-Month Loans

| Application Date | Repayment Date     | Explanation                |
| ---------------- | ------------------ | -------------------------- |
| August 10, 2025  | August 31, 2025    | Before 22nd → same month   |
| August 21, 2025  | August 31, 2025    | Before 22nd → same month   |
| August 22, 2025  | September 30, 2025 | On/after 22nd → next month |
| August 25, 2025  | September 30, 2025 | After 22nd → next month    |

### Multi-Month Loans

The 22nd day rule **only applies to 1-month repayment periods**. Longer repayment periods follow standard month addition:

| Application Date | Repayment Period | Repayment Date    | Explanation              |
| ---------------- | ---------------- | ----------------- | ------------------------ |
| August 10, 2025  | 2 months         | October 31, 2025  | Standard: Aug + 2 months |
| August 25, 2025  | 3 months         | November 30, 2025 | Standard: Aug + 3 months |

## Technical Implementation

The rule is implemented in:

- `App\Models\Loan::calculateRepaymentDate()` - Static method for calculation
- `LoanController@create()` - Applied when showing available repayment options
- `LoanController@store()` - Applied when creating new loans

## Benefits

1. **Borrower Flexibility**: Loans taken early in the month can be repaid quickly
2. **Predictable Cash Flow**: Late-month loans don't create immediate repayment pressure
3. **Fair Timeline**: Ensures borrowers always have reasonable time to repay
