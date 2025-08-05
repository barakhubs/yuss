<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void 
    {
        // Create default chairperson (admin)
        User::firstOrCreate(
            ['email' => 'markbrightbaraka@gmail.com'],
            [
                'name' => 'SACCO Administrator',
                'password' => Hash::make('password'),
                'role' => 'chairperson',
                'is_verified' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
