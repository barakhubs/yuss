# SACCO Interest Distribution System

## Overview

The SACCO operates with a quarterly share-out system where savings and loan interest are handled differently:

- **Q1 & Q2**: Only savings are shared out (no interest)
- **Q3**: Both savings AND loan interest are shared out
- **Q4**: Regular quarter (no specific share-out mentioned)

## Loan Interest (5% on all loans)

When a member takes a loan, they pay back the principal + 5% interest.

### Interest Distribution (Q3 Only)

For every dollar of interest collected from loans:

1. **50%** → Goes to the loan bearer (the member who took the loan)
2. **25%** → Distributed equally among committee members
3. **25%** → Distributed equally among all non-committee members (including loan bearers)

### Example: $100 Loan

- Loan amount: $100
- Interest: $5 (5%)
- Total repayment: $105

**Interest Distribution:**

- Loan bearer gets: $2.50 (50% of $5)
- Committee share: $1.25 (25% of $5, divided among committee members)
- General member share: $1.25 (25% of $5, divided among all non-committee members)

**Note:** The loan bearer participates in both their individual 50% share AND the general member pool (25% share).

## Savings Share-Out

- **Q1 & Q2**: Members can choose to share out their savings (principal only)
- **Q3**: Members can choose to share out their savings + their calculated interest share
- No interest is earned on savings themselves

## Member Categories

### Committee Members

- Chairperson
- Secretary
- Treasurer
- Disburser

### Non-Committee Members

- All other regular members
- Includes loan bearers who get both individual and general shares

## Implementation Notes

### Interest Calculation Logic

1. Get all repaid loans for the year
2. Calculate total interest collected
3. For each member:
    - If they took loans: Add 50% of their loan interest
    - Add their share of the 25% general member pool
    - Committee members get their share of the 25% committee pool

### Quarter-Specific Behavior

- `quarter_number == 3` triggers interest calculations
- Other quarters only handle savings share-outs
- Admin interface shows different options based on quarter

### Database Changes

The `shareout_decisions` table stores:

- `savings_balance`: Member's savings for the quarter
- `interest_amount`: Calculated interest share (only for Q3)
- `wants_shareout`: Member's decision to share out or keep
