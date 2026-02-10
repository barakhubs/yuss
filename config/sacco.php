<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Member Categories Configuration
    |--------------------------------------------------------------------------
    |
    | Define the different member categories and their associated benefits,
    | contribution amounts, and loan limits.
    |
    */

    'categories' => [
        'A' => [
            'monthly_savings' => 500,
            'welfare' => [
                'group_contribution' => 1000,
                'yukon_contribution' => 500,
                'total_payout' => 1500,
            ],
            'loans' => [
                'savings_loan' => [
                    'min' => 2000,
                    'max' => 7500,
                    'start_month' => 2, // February
                    'interest_rate' => 10.0, // 10% per annum
                    'max_repayment_months' => 12,
                ],
                'social_fund_loan' => [
                    'min' => 500,
                    'max' => 1000,
                    'interest_rate' => 60.0, // 60% per annum (5% per month for 1-month loans)
                    'max_repayment_months' => 1,
                ],
            ],
        ],
        'B' => [
            'monthly_savings' => 300,
            'welfare' => [
                'group_contribution' => 750,
                'yukon_contribution' => 500,
                'total_payout' => 1250,
            ],
            'loans' => [
                'savings_loan' => [
                    'min' => 1000,
                    'max' => 5000,
                    'start_month' => 2, // February
                    'interest_rate' => 10.0, // 10% per annum
                    'max_repayment_months' => 12,
                ],
                'social_fund_loan' => [
                    'min' => 300,
                    'max' => 500,
                    'interest_rate' => 60.0, // 60% per annum (5% per month for 1-month loans)
                    'max_repayment_months' => 1,
                ],
            ],
        ],
        'C' => [
            'monthly_savings' => 100,
            'welfare' => [
                'group_contribution' => 250,
                'yukon_contribution' => 500,
                'total_payout' => 750,
            ],
            'loans' => [
                'savings_loan' => [
                    'min' => 300,
                    'max' => 500,
                    'start_month' => 1, // January
                    'interest_rate' => 10.0, // 10% per annum
                    'max_repayment_months' => 12,
                ],
                'social_fund_loan' => [
                    'min' => 100,
                    'max' => 300,
                    'interest_rate' => 60.0, // 60% per annum (5% per month for 1-month loans)
                    'max_repayment_months' => 1,
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Savings Breakdown
    |--------------------------------------------------------------------------
    |
    | Percentage breakdown of monthly savings across different funds.
    | Applied to all categories.
    |
    */

    'savings_breakdown' => [
        'main_savings' => 75.0,      // 75% - Borrowable at 10% annual interest
        'social_fund' => 17.5,       // 17.5% - Emergency loans at 5% monthly
        'welfare_fund' => 7.5,       // 7.5% - For bereavement, weddings, ceremonial introductions
    ],

    /*
    |--------------------------------------------------------------------------
    | Yukon Staff Welfare Fund
    |--------------------------------------------------------------------------
    |
    | Company contribution system for staff welfare.
    |
    */

    'yukon_welfare' => [
        'monthly_contribution' => 250,
        'annual_contribution' => 3000,
        'benefits' => [
            'bereavement' => 500,
            'wedding' => 500,
        ],
        'loans' => [
            'min' => 300,
            'max' => 1000,
            'interest_rate' => 10.0, // 10% per annum
            'start_month' => 3, // March
            'max_repayment_months' => 1,
        ],
        'shareout' => [
            'frequency_years' => 2,
            'min_service_years' => 4,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | School Fees Loan
    |--------------------------------------------------------------------------
    |
    | Special 0% interest loan for school-going dependents.
    |
    */

    'school_fees_loan' => [
        'min' => 125,
        'max' => 500,
        'interest_rate' => 0.0,
        'max_repayment_months' => 1,
        'requires_dependents' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Annual Membership Fee
    |--------------------------------------------------------------------------
    */

    'annual_membership_fee' => 5,

    /*
    |--------------------------------------------------------------------------
    | Share-Out Schedule
    |--------------------------------------------------------------------------
    |
    | Define when different funds are shared out.
    |
    */

    'shareout_schedule' => [
        'social_fund' => [
            'frequency' => 'quarterly', // Every 4 months
            'months' => [4, 8, 12],     // April, August, December
        ],
        'main_savings' => [
            'frequency' => 'annual',
        ],
        'welfare_fund' => [
            'frequency' => 'annual',
            'category_based' => true,  // Different amounts per category
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Welfare Events
    |--------------------------------------------------------------------------
    |
    | Events that trigger welfare fund payouts.
    |
    */

    'welfare_events' => [
        'bereavement',
        'wedding',
        'ceremonial_introduction',
    ],

    /*
    |--------------------------------------------------------------------------
    | Loan Restrictions
    |--------------------------------------------------------------------------
    */

    'loan_restrictions' => [
        // Cannot get Yukon Welfare loan if already has savings loan
        'yukon_welfare_blocks_savings_loan' => true,
        'savings_loan_blocks_yukon_welfare' => true,
    ],
];
