<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update the super admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Remove from all organizations if they belong to any
        if ($superAdmin->organizations()->exists()) {
            $orgCount = $superAdmin->organizations()->count();
            $superAdmin->removeFromAllOrganizations();
            $this->command->info("Removed super admin from {$orgCount} organization(s)");
        }

        // Make sure they're a super admin
        if (!$superAdmin->is_super_admin) {
            $superAdmin->makeSuperAdmin();
            $this->command->info('User promoted to super admin: ' . $superAdmin->email);
        } else {
            $this->command->info('Super admin user exists: ' . $superAdmin->email);
        }
    }
}
