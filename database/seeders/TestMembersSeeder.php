<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Quarter;
use App\Models\MemberSavingsTarget;
use App\Models\Saving;
use App\Models\Loan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestMembersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create active quarter
        $currentQuarter = Quarter::where('status', 'active')->first();
        if (!$currentQuarter) {
            $currentQuarter = Quarter::create([
                'quarter_number' => 3,
                'year' => 2025,
                'name' => 'Q3 2025',
                'start_date' => '2025-09-01',
                'end_date' => '2025-12-31',
                'status' => 'active',
            ]);
        }

        // Test members data
        $testMembers = [
            [
                'name' => 'John Doe',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john.doe@sacco.local',
                'role' => 'member',
                'target' => 500,
                'savings_made' => 2,
                'total_savings' => 1000,
                'has_loan' => true,
                'loan_amount' => 5000,
                'loan_balance' => 3500,
            ],
            [
                'name' => 'Jane Smith',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'email' => 'jane.smith@sacco.local',
                'role' => 'secretary',
                'target' => 300,
                'savings_made' => 3,
                'total_savings' => 900,
                'has_loan' => false,
                'loan_amount' => 0,
                'loan_balance' => 0,
            ],
            [
                'name' => 'Michael Johnson',
                'first_name' => 'Michael',
                'last_name' => 'Johnson',
                'email' => 'michael.johnson@sacco.local',
                'role' => 'treasurer',
                'target' => 750,
                'savings_made' => 1,
                'total_savings' => 750,
                'has_loan' => false,
                'loan_amount' => 0,
                'loan_balance' => 0,
            ],
            [
                'name' => 'Sarah Williams',
                'first_name' => 'Sarah',
                'last_name' => 'Williams',
                'email' => 'sarah.williams@sacco.local',
                'role' => 'member',
                'target' => 400,
                'savings_made' => 2,
                'total_savings' => 600,
                'has_loan' => true,
                'loan_amount' => 3000,
                'loan_balance' => 2100,
            ],
            [
                'name' => 'David Brown',
                'first_name' => 'David',
                'last_name' => 'Brown',
                'email' => 'david.brown@sacco.local',
                'role' => 'disburser',
                'target' => 600,
                'savings_made' => 1,
                'total_savings' => 600,
                'has_loan' => false,
                'loan_amount' => 0,
                'loan_balance' => 0,
            ],
            [
                'name' => 'Emily Davis',
                'first_name' => 'Emily',
                'last_name' => 'Davis',
                'email' => 'emily.davis@sacco.local',
                'role' => 'member',
                'target' => 250,
                'savings_made' => 3,
                'total_savings' => 750,
                'has_loan' => false,
                'loan_amount' => 0,
                'loan_balance' => 0,
            ],
            [
                'name' => 'Robert Miller',
                'first_name' => 'Robert',
                'last_name' => 'Miller',
                'email' => 'robert.miller@sacco.local',
                'role' => 'member',
                'target' => 350,
                'savings_made' => 0,
                'total_savings' => 0,
                'has_loan' => false,
                'loan_amount' => 0,
                'loan_balance' => 0,
            ],
            [
                'name' => 'Lisa Wilson',
                'first_name' => 'Lisa',
                'last_name' => 'Wilson',
                'email' => 'lisa.wilson@sacco.local',
                'role' => 'member',
                'target' => 500,
                'savings_made' => 2,
                'total_savings' => 1000,
                'has_loan' => true,
                'loan_amount' => 4000,
                'loan_balance' => 1200,
            ],
        ];

        foreach ($testMembers as $memberData) {
            // Create or update user
            $user = User::firstOrCreate(
                ['email' => $memberData['email']],
                [
                    'name' => $memberData['name'],
                    'first_name' => $memberData['first_name'],
                    'last_name' => $memberData['last_name'],
                    'password' => Hash::make('password'),
                    'role' => $memberData['role'],
                    'is_verified' => true,
                    'email_verified_at' => now(),
                    'last_login_at' => now()->subDays(rand(1, 30)),
                ]
            );

            // Create savings target for current quarter
            $target = MemberSavingsTarget::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'quarter_id' => $currentQuarter->id,
                ],
                [
                    'monthly_target' => $memberData['target'],
                ]
            );

            // Create savings records
            for ($i = 0; $i < $memberData['savings_made']; $i++) {
                $savedOn = now()->subMonths($i)->startOfMonth()->addDays(14); // Mid-month
                $amount = $memberData['target'] + rand(-50, 50); // Vary the amount slightly

                Saving::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'quarter_id' => $currentQuarter->id,
                        'saved_on' => $savedOn->toDateString(),
                    ],
                    [
                        'amount' => $amount,
                        'recorded_by' => 1, // Assuming admin user with ID 1 recorded it
                        'notes' => 'Monthly savings contribution',
                        'created_at' => $savedOn,
                    ]
                );
            }

            // Create loan if member has one
            if ($memberData['has_loan']) {
                $totalAmount = $memberData['loan_amount'] * 1.05; // 5% fixed interest
                $loan = Loan::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'amount' => $memberData['loan_amount'],
                    ],
                    [
                        'quarter_id' => $currentQuarter->id,
                        'loan_number' => 'LN' . $user->id . time(),
                        'total_amount' => $totalAmount,
                        'amount_paid' => $totalAmount - $memberData['loan_balance'],
                        'outstanding_balance' => $memberData['loan_balance'],
                        'status' => 'disbursed',
                        'purpose' => 'Business expansion',
                        'admin_notes' => 'Test loan for seeding',
                        'applied_date' => now()->subMonths(3)->toDateString(),
                        'approved_date' => now()->subMonths(3)->addDays(2)->toDateString(),
                        'approved_by' => 1, // Admin user
                        'disbursed_date' => now()->subMonths(3)->addDays(5)->toDateString(),
                        'expected_repayment_date' => now()->addMonths(9)->toDateString(),
                    ]
                );
            }
        }

        $this->command->info('Test members created successfully with savings and loans data!');
        $this->command->info('All members use password: password');
    }
}
