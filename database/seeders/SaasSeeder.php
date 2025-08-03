<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SaasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo users
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@yukonsoftware.com'],
            [
                'name' => 'SACCO Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $memberUser1 = User::firstOrCreate(
            ['email' => 'member1@yukonsoftware.com'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $memberUser2 = User::firstOrCreate(
            ['email' => 'member2@yukonsoftware.com'],
            [
                'name' => 'Jane Smith',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $memberUser3 = User::firstOrCreate(
            ['email' => 'member3@yukonsoftware.com'],
            [
                'name' => 'Bob Johnson',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create SACCO organization
        $organization = Organization::firstOrCreate(
            ['slug' => 'yukon-software-sacco'],
            [
                'name' => 'Yukon Software SACCO',
                'description' => 'Savings and Credit Cooperative Organization for Yukon Software staff',
                'website' => 'https://yukonsoftware.com',
                'owner_id' => $adminUser->id,
            ]
        );

        // Add users to organization
        if (!$organization->users()->where('user_id', $adminUser->id)->exists()) {
            $organization->addUser($adminUser, 'admin');
        }

        if (!$organization->users()->where('user_id', $memberUser1->id)->exists()) {
            $organization->addUser($memberUser1, 'member');
        }

        if (!$organization->users()->where('user_id', $memberUser2->id)->exists()) {
            $organization->addUser($memberUser2, 'member');
        }

        if (!$organization->users()->where('user_id', $memberUser3->id)->exists()) {
            $organization->addUser($memberUser3, 'member');
        }

        $this->command->info('SACCO demo data created successfully!');
        $this->command->info('Admin login: admin@yukonsoftware.com / password');
        $this->command->info('Member logins:');
        $this->command->info('  member1@yukonsoftware.com / password');
        $this->command->info('  member2@yukonsoftware.com / password');
        $this->command->info('  member3@yukonsoftware.com / password');
    }
}
