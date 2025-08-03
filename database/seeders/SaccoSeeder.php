<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Sacco\MemberCommitteeRole;
use App\Models\Sacco\SaccoYear;
use App\Models\User;
use Illuminate\Database\Seeder;

class SaccoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find or create Yukon Software organization
        $organization = Organization::firstOrCreate(
            ['slug' => 'yukon-software'],
            [
                'name' => 'Yukon Software SACCO',
                'description' => 'Savings and Credit Cooperative Organization for Yukon Software staff',
                'website' => 'https://yukonsoftware.com',
                'owner_id' => 1, // Assuming first user exists
                'trial_ends_at' => now()->addDays(14),
            ]
        );

        // Create SACCO year for 2025
        $saccoYear = SaccoYear::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'year' => 2025,
            ],
            [
                'start_date' => '2025-01-01',
                'end_date' => '2025-12-31',
                'is_active' => true,
            ]
        );

        // Create quarters for the year
        $quarters = [
            [
                'quarter_number' => 1,
                'start_date' => '2025-01-01',
                'end_date' => '2025-04-30',
            ],
            [
                'quarter_number' => 2,
                'start_date' => '2025-05-01',
                'end_date' => '2025-08-31',
            ],
            [
                'quarter_number' => 3,
                'start_date' => '2025-09-01',
                'end_date' => '2025-12-31',
            ],
        ];

        foreach ($quarters as $quarterData) {
            $saccoYear->quarters()->firstOrCreate(
                ['quarter_number' => $quarterData['quarter_number']],
                $quarterData
            );
        }

        // If we have users, assign some committee roles
        $users = User::limit(4)->get();

        if ($users->count() >= 4) {
            $roles = ['chairperson', 'secretary', 'treasurer', 'disbursor'];

            foreach ($users as $index => $user) {
                // Add user to organization if not already a member
                if (!$user->organizations()->where('organization_id', $organization->id)->exists()) {
                    $organization->addUser($user, 'member');
                }

                // Assign committee role
                MemberCommitteeRole::firstOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'user_id' => $user->id,
                        'role' => $roles[$index],
                    ],
                    [
                        'assigned_date' => now(),
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('SACCO data seeded successfully!');
        $this->command->info('Organization: ' . $organization->name);
        $this->command->info('SACCO Year: ' . $saccoYear->year);
        $this->command->info('Quarters: 3 quarters created');
        $this->command->info('Committee roles: ' . $users->count() . ' roles assigned');
    }
}
