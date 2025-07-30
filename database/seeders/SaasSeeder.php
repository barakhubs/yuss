<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SaasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'manage organizations',
            'manage users',
            'manage billing',
            'view analytics',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $memberRole = Role::firstOrCreate(['name' => 'member']);

        // Give admin all permissions
        $adminRole->syncPermissions($permissions);

        // Create demo users
        $demoUser1 = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $demoUser2 = User::firstOrCreate(
            ['email' => 'member@example.com'],
            [
                'name' => 'Member User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create demo organization
        $organization = Organization::firstOrCreate(
            ['slug' => 'acme-corp'],
            [
                'name' => 'Acme Corporation',
                'description' => 'A demo organization for testing SaaS features',
                'website' => 'https://acme.example.com',
                'owner_id' => $demoUser1->id,
                'trial_ends_at' => now()->addDays(14),
            ]
        );

        // Add users to organization
        if (!$organization->users()->where('user_id', $demoUser1->id)->exists()) {
            $organization->addUser($demoUser1, 'admin');
        }

        if (!$organization->users()->where('user_id', $demoUser2->id)->exists()) {
            $organization->addUser($demoUser2, 'member');
        }

        // Assign roles to users
        $demoUser1->assignRole('admin');
        $demoUser2->assignRole('member');

        $this->command->info('SaaS demo data created successfully!');
        $this->command->info('Admin login: admin@example.com / password');
        $this->command->info('Member login: member@example.com / password');
    }
}
