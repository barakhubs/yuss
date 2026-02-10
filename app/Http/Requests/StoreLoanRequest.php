<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLoanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated and not an admin
        return auth()->check() && !auth()->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = auth()->user();

        // Get loan limits based on user's category
        $loanType = $this->input('loan_type', 'savings_loan');
        $loanLimits = $user->getLoanLimits($loanType);

        if (!$loanLimits) {
            return [
                'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
                'purpose' => ['required', 'string', 'max:500'],
                'repayment_period_months' => ['required', 'integer', 'min:1', 'max:12'],
                'loan_type' => ['sometimes', 'string', 'in:savings_loan,social_fund_loan,yukon_welfare_loan,school_fees_loan'],
            ];
        }

        // For savings loans, calculate max repayment months from now to December
        // Sacco year runs Jan to Dec - no loan should cross to next year
        $maxRepaymentMonths = $loanLimits['max_repayment_months'];
        if ($loanType === 'savings_loan') {
            $currentDate = now();
            // Calculate months to December without crossing year boundary
            $monthsToEndOfYear = 12 - $currentDate->month;
            // Minimum 1 month if we're in December and can use 22nd day rule
            if ($monthsToEndOfYear <= 0) {
                $monthsToEndOfYear = ($currentDate->day < 22) ? 1 : 0;
            }
            $maxRepaymentMonths = max(1, $monthsToEndOfYear);
        }

        return [
            'amount' => [
                'required',
                'numeric',
                'min:' . $loanLimits['min'],
                'max:' . $loanLimits['max'],
            ],
            'purpose' => ['required', 'string', 'max:500'],
            'repayment_period_months' => [
                'required',
                'integer',
                'min:1',
                'max:' . $maxRepaymentMonths,
            ],
            'loan_type' => ['sometimes', 'string', 'in:savings_loan,social_fund_loan,yukon_welfare_loan,school_fees_loan'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = auth()->user();
            $loanType = $this->input('loan_type', 'savings_loan');

            // Check if user has a category
            if (!$user->hasCategory()) {
                $validator->errors()->add('category', 'You must have a savings category assigned before applying for a loan.');
                return;
            }

            // Check if user can apply for this loan type at current date
            if (!$user->canApplyForLoan($loanType)) {
                $loanLimits = $user->getLoanLimits($loanType);
                $startMonth = $loanLimits['start_month'] ?? 1;
                $monthName = date('F', mktime(0, 0, 0, $startMonth, 1));
                $validator->errors()->add('loan_type', "Category {$user->savings_category} members can apply for this loan type starting from {$monthName}.");
            }

            // Check for conflicting loans (e.g., Yukon welfare blocks savings loan)
            if ($loanType === 'yukon_welfare_loan') {
                $hasActiveSavingsLoan = $user->loans()
                    ->where('loan_type', 'savings_loan')
                    ->whereIn('status', ['approved', 'disbursed'])
                    ->exists();

                if ($hasActiveSavingsLoan) {
                    $validator->errors()->add('loan_type', 'You cannot apply for a Yukon Welfare loan while you have an active savings loan.');
                }
            }
        });
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        $user = auth()->user();
        $loanType = $this->input('loan_type', 'savings_loan');
        $loanLimits = $user?->getLoanLimits($loanType);

        if (!$loanLimits) {
            return [];
        }

        return [
            'amount.min' => "Loan amount must be at least €{$loanLimits['min']} for your category.",
            'amount.max' => "Loan amount cannot exceed €{$loanLimits['max']} for your category.",
            'repayment_period_months.max' => "Maximum repayment period is {$loanLimits['max_repayment_months']} month(s) for this loan type.",
        ];
    }
}
