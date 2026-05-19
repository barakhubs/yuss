<?php

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\Quarter;
use App\Models\Saving;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SaccoSeeder extends Seeder
{
    private User $admin;
    private array $quarters = [];

    public function run(): void
    {
        $this->admin = User::where('role', 'chairperson')->first();

        // Load quarters indexed by "Q{n} {year}"
        Quarter::all()->each(function (Quarter $q) {
            $this->quarters["Q{$q->quarter_number} {$q->year}"] = $q;
        });

        $members = $this->createMembers();
        $this->createSavings($members);
        $this->createLoans($members);
    }

    // -------------------------------------------------------------------------
    // Members
    // -------------------------------------------------------------------------

    private function createMembers(): array
    {
        $data = [
            // Category A (€500/month)
            ['first_name' => 'Alice',   'last_name' => 'Mwangi',   'email' => 'alice.mwangi@example.com',   'category' => 'A', 'joined' => '2024-01-01'],
            ['first_name' => 'Brian',   'last_name' => 'Otieno',   'email' => 'brian.otieno@example.com',   'category' => 'A', 'joined' => '2024-01-01'],
            ['first_name' => 'Caroline','last_name' => 'Njoroge',  'email' => 'caroline.njoroge@example.com','category' => 'A', 'joined' => '2024-05-01'],

            // Category B (€300/month)
            ['first_name' => 'David',   'last_name' => 'Kamau',    'email' => 'david.kamau@example.com',    'category' => 'B', 'joined' => '2024-01-01'],
            ['first_name' => 'Evelyn',  'last_name' => 'Wambui',   'email' => 'evelyn.wambui@example.com',  'category' => 'B', 'joined' => '2024-01-01'],
            ['first_name' => 'Francis', 'last_name' => 'Odhiambo', 'email' => 'francis.odhiambo@example.com','category' => 'B', 'joined' => '2025-01-01'],

            // Category C (€200/month)
            ['first_name' => 'Grace',   'last_name' => 'Achieng',  'email' => 'grace.achieng@example.com',  'category' => 'C', 'joined' => '2024-01-01'],
            ['first_name' => 'Henry',   'last_name' => 'Mutua',    'email' => 'henry.mutua@example.com',    'category' => 'C', 'joined' => '2024-09-01'],
            ['first_name' => 'Irene',   'last_name' => 'Chege',    'email' => 'irene.chege@example.com',    'category' => 'C', 'joined' => '2025-05-01'],

            // Category D (€50/month)
            ['first_name' => 'James',   'last_name' => 'Kiprotich','email' => 'james.kiprotich@example.com','category' => 'D', 'joined' => '2024-01-01'],
            ['first_name' => 'Kayla',   'last_name' => 'Auma',     'email' => 'kayla.auma@example.com',     'category' => 'D', 'joined' => '2025-01-01'],

            // Category E (€25/month)
            ['first_name' => 'Lilian',  'last_name' => 'Simiyu',   'email' => 'lilian.simiyu@example.com',  'category' => 'E', 'joined' => '2024-09-01'],
            ['first_name' => 'Moses',   'last_name' => 'Baraka',   'email' => 'moses.baraka@example.com',   'category' => 'E', 'joined' => '2026-05-01'],
        ];

        $members = [];
        foreach ($data as $d) {
            $member = User::firstOrCreate(
                ['email' => $d['email']],
                [
                    'name'             => $d['first_name'] . ' ' . $d['last_name'],
                    'first_name'       => $d['first_name'],
                    'last_name'        => $d['last_name'],
                    'password'         => Hash::make('password'),
                    'role'             => 'member',
                    'savings_category' => $d['category'],
                    'savings_start_date' => $d['joined'],
                    'is_verified'      => true,
                    'email_verified_at' => now(),
                    'created_by_admin'  => true,
                ]
            );
            $members[] = $member;
        }

        $this->command->info('Created ' . count($members) . ' members (A–E).');
        return $members;
    }

    // -------------------------------------------------------------------------
    // Savings
    // -------------------------------------------------------------------------

    private function createSavings(array $members): void
    {
        $monthlySavings = [
            'A' => 500, 'B' => 300, 'C' => 200, 'D' => 50, 'E' => 25,
        ];

        // Quarters to seed savings for (past + current)
        $quarterKeys = [
            'Q1 2024', 'Q2 2024', 'Q3 2024',
            'Q1 2025', 'Q2 2025', 'Q3 2025',
            'Q1 2026', 'Q2 2026',
        ];

        $count = 0;

        foreach ($members as $member) {
            $monthly = $monthlySavings[$member->savings_category];
            $joinedDate = Carbon::parse($member->savings_start_date);

            foreach ($quarterKeys as $qKey) {
                $quarter = $this->quarters[$qKey] ?? null;
                if (! $quarter) {
                    continue;
                }

                // Skip if member hadn't joined yet
                $quarterStart = Carbon::parse($quarter->start_date);
                if ($joinedDate->gt($quarterStart->copy()->endOfMonth()->addMonths(3))) {
                    continue;
                }

                // Calculate months in this quarter the member was present
                $quarterEnd = Carbon::parse($quarter->end_date);
                $effectiveStart = $joinedDate->gt($quarterStart) ? $joinedDate : $quarterStart;
                $months = max(1, (int) ceil($effectiveStart->diffInMonths($quarterEnd->copy()->addDay())));
                $months = min($months, 4); // max 4 months per quarter

                $amount = $monthly * $months;

                // Don't seed savings for quarters after the current date
                if ($quarterStart->isFuture()) {
                    continue;
                }

                // For current quarter (Q2 2026) add partial savings if member joined before May 19
                if ($qKey === 'Q2 2026') {
                    // Only 1 month payment so far (May only partly done — seed 1 month)
                    $amount = $monthly * 1;
                }

                // Avoid duplicates
                $exists = Saving::where('user_id', $member->id)
                    ->where('quarter_id', $quarter->id)
                    ->exists();

                if (! $exists) {
                    Saving::create([
                        'user_id'     => $member->id,
                        'quarter_id'  => $quarter->id,
                        'amount'      => $amount,
                        'saved_on'    => Carbon::parse($quarter->end_date)->subMonth()->startOfMonth()->toDateString(),
                        'notes'       => "Quarterly savings for {$qKey}",
                        'recorded_by' => $this->admin->id,
                    ]);
                    $count++;
                }
            }
        }

        $this->command->info("Created {$count} saving records.");
    }

    // -------------------------------------------------------------------------
    // Loans
    // -------------------------------------------------------------------------

    private function createLoans(array $members): void
    {
        $adminId = $this->admin->id;

        /** @var Quarter|null $q2_2026 */
        $q2_2026 = $this->quarters['Q2 2026'] ?? null;
        /** @var Quarter|null $q1_2026 */
        $q1_2026 = $this->quarters['Q1 2026'] ?? null;
        /** @var Quarter|null $q3_2025 */
        $q3_2025 = $this->quarters['Q3 2025'] ?? null;
        /** @var Quarter|null $q2_2025 */
        $q2_2025 = $this->quarters['Q2 2025'] ?? null;

        // Lookup members by email
        $alice    = $this->findMember($members, 'alice.mwangi@example.com');
        $brian    = $this->findMember($members, 'brian.otieno@example.com');
        $caroline = $this->findMember($members, 'caroline.njoroge@example.com');
        $david    = $this->findMember($members, 'david.kamau@example.com');
        $evelyn   = $this->findMember($members, 'evelyn.wambui@example.com');
        $grace    = $this->findMember($members, 'grace.achieng@example.com');
        $henry    = $this->findMember($members, 'henry.mutua@example.com');
        $james    = $this->findMember($members, 'james.kiprotich@example.com');

        $loansToCreate = [];

        if ($alice && $q2_2026) {
            $loansToCreate[] = [
                'member'          => $alice,
                'quarter'         => $q2_2026,
                'loan_type'       => 'savings_loan',
                'amount'          => 2000.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 6,
                'status'          => 'disbursed',
                'applied_date'    => '2026-05-02',
                'approved_date'   => '2026-05-04',
                'disbursed_date'  => '2026-05-05',
                'purpose'         => 'Home renovation',
                'repayments'      => [],
            ];
        }

        if ($brian && $q2_2026) {
            $loansToCreate[] = [
                'member'          => $brian,
                'quarter'         => $q2_2026,
                'loan_type'       => 'savings_loan',
                'amount'          => 1500.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 4,
                'status'          => 'approved',
                'applied_date'    => '2026-05-10',
                'approved_date'   => '2026-05-12',
                'disbursed_date'  => null,
                'purpose'         => 'Business capital',
                'repayments'      => [],
            ];
        }

        if ($caroline && $q2_2026) {
            $loansToCreate[] = [
                'member'          => $caroline,
                'quarter'         => $q2_2026,
                'loan_type'       => 'social_fund_loan',
                'amount'          => 200.00,
                'interest_rate'   => 60.0,
                'repayment_months'=> 1,
                'status'          => 'pending',
                'applied_date'    => '2026-05-15',
                'approved_date'   => null,
                'disbursed_date'  => null,
                'purpose'         => 'Emergency medical bill',
                'repayments'      => [],
            ];
        }

        if ($david && $q1_2026) {
            // Completed loan from Q1 2026
            $loansToCreate[] = [
                'member'          => $david,
                'quarter'         => $q1_2026,
                'loan_type'       => 'savings_loan',
                'amount'          => 1200.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 3,
                'status'          => 'completed',
                'applied_date'    => '2026-01-10',
                'approved_date'   => '2026-01-12',
                'disbursed_date'  => '2026-01-15',
                'actual_repayment_date' => '2026-04-15',
                'purpose'         => 'School fees',
                'repayments'      => [
                    ['date' => '2026-02-15', 'amount' => 410.00],
                    ['date' => '2026-03-15', 'amount' => 410.00],
                    ['date' => '2026-04-15', 'amount' => 410.00],
                ],
            ];
        }

        if ($evelyn && $q2_2025) {
            // Rejected loan
            $loansToCreate[] = [
                'member'          => $evelyn,
                'quarter'         => $q2_2025,
                'loan_type'       => 'savings_loan',
                'amount'          => 2000.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 6,
                'status'          => 'rejected',
                'applied_date'    => '2025-05-05',
                'approved_date'   => null,
                'disbursed_date'  => null,
                'admin_notes'     => 'Insufficient savings balance at time of application.',
                'purpose'         => 'Car purchase',
                'repayments'      => [],
            ];
        }

        if ($evelyn && $q1_2026) {
            // Active disbursed loan with 2 repayments made
            $loansToCreate[] = [
                'member'          => $evelyn,
                'quarter'         => $q1_2026,
                'loan_type'       => 'savings_loan',
                'amount'          => 900.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 4,
                'status'          => 'disbursed',
                'applied_date'    => '2026-01-08',
                'approved_date'   => '2026-01-10',
                'disbursed_date'  => '2026-01-12',
                'purpose'         => 'Household furniture',
                'repayments'      => [
                    ['date' => '2026-02-12', 'amount' => 231.25],
                    ['date' => '2026-03-12', 'amount' => 231.25],
                ],
            ];
        }

        if ($grace && $q3_2025) {
            $loansToCreate[] = [
                'member'          => $grace,
                'quarter'         => $q3_2025,
                'loan_type'       => 'savings_loan',
                'amount'          => 600.00,
                'interest_rate'   => 10.0,
                'repayment_months'=> 3,
                'status'          => 'completed',
                'applied_date'    => '2025-09-03',
                'approved_date'   => '2025-09-05',
                'disbursed_date'  => '2025-09-06',
                'actual_repayment_date' => '2025-12-06',
                'purpose'         => 'Agricultural inputs',
                'repayments'      => [
                    ['date' => '2025-10-06', 'amount' => 205.00],
                    ['date' => '2025-11-06', 'amount' => 205.00],
                    ['date' => '2025-12-06', 'amount' => 205.00],
                ],
            ];
        }

        if ($henry && $q2_2026) {
            $loansToCreate[] = [
                'member'          => $henry,
                'quarter'         => $q2_2026,
                'loan_type'       => 'social_fund_loan',
                'amount'          => 150.00,
                'interest_rate'   => 60.0,
                'repayment_months'=> 1,
                'status'          => 'disbursed',
                'applied_date'    => '2026-05-01',
                'approved_date'   => '2026-05-02',
                'disbursed_date'  => '2026-05-03',
                'purpose'         => 'Urgent travel expenses',
                'repayments'      => [],
            ];
        }

        if ($james && $q2_2026) {
            $loansToCreate[] = [
                'member'          => $james,
                'quarter'         => $q2_2026,
                'loan_type'       => 'social_fund_loan',
                'amount'          => 50.00,
                'interest_rate'   => 60.0,
                'repayment_months'=> 1,
                'status'          => 'disbursed',
                'applied_date'    => '2026-05-08',
                'approved_date'   => '2026-05-09',
                'disbursed_date'  => '2026-05-10',
                'purpose'         => 'Utility bills',
                'repayments'      => [],
            ];
        }

        $count = 0;
        foreach ($loansToCreate as $i => $spec) {
            /** @var User $member */
            $member = $spec['member'];
            /** @var Quarter $quarter */
            $quarter = $spec['quarter'];

            $loanNumber = 'L' . date('Y', strtotime($spec['applied_date'])) . str_pad(Loan::count() + 1, 4, '0', STR_PAD_LEFT);

            $annualRate = $spec['interest_rate'] / 100;
            $prorated   = ($annualRate / 12) * $spec['repayment_months'];
            $totalAmount = round($spec['amount'] * (1 + $prorated), 2);
            $amountPaid  = 0;
            foreach (($spec['repayments'] ?? []) as $r) {
                $amountPaid += $r['amount'];
            }
            $outstanding = max(0, round($totalAmount - $amountPaid, 2));

            // Determine final status
            $status = $spec['status'];
            if ($status === 'disbursed' && $outstanding <= 0) {
                $status = 'completed';
            }

            $existing = Loan::where('user_id', $member->id)
                ->where('quarter_id', $quarter->id)
                ->where('purpose', $spec['purpose'])
                ->first();

            if ($existing) {
                continue;
            }

            $loan = Loan::create([
                'user_id'          => $member->id,
                'quarter_id'       => $quarter->id,
                'loan_number'      => $loanNumber,
                'loan_type'        => $spec['loan_type'],
                'amount'           => $spec['amount'],
                'total_amount'     => $totalAmount,
                'amount_paid'      => $amountPaid,
                'outstanding_balance' => $outstanding,
                'status'           => $status,
                'purpose'          => $spec['purpose'],
                'admin_notes'      => $spec['admin_notes'] ?? null,
                'applied_date'     => $spec['applied_date'],
                'approved_date'    => $spec['approved_date'] ?? null,
                'approved_by'      => ($spec['approved_date'] ?? null) ? $adminId : null,
                'disbursed_date'   => $spec['disbursed_date'] ?? null,
                'expected_repayment_date' => $spec['disbursed_date']
                    ? Carbon::parse($spec['disbursed_date'])->addMonths($spec['repayment_months'])->toDateString()
                    : null,
                'actual_repayment_date'  => $spec['actual_repayment_date'] ?? null,
                'repayment_period_months' => $spec['repayment_months'],
            ]);

            $count++;

            foreach (($spec['repayments'] ?? []) as $r) {
                $principal = round($spec['amount'] / $spec['repayment_months'], 2);
                $interest  = round(($r['amount'] - $principal), 2);

                LoanRepayment::create([
                    'loan_id'           => $loan->id,
                    'amount'            => $r['amount'],
                    'principal_portion' => max(0, $principal),
                    'interest_portion'  => max(0, $interest),
                    'payment_date'      => $r['date'],
                    'payment_method'    => 'bank_transfer',
                    'notes'             => 'Seeded repayment',
                ]);
            }
        }

        $this->command->info("Created {$count} loans with repayments.");
    }

    private function findMember(array $members, string $email): ?User
    {
        foreach ($members as $m) {
            if ($m->email === $email) {
                return $m;
            }
        }
        return null;
    }
}
