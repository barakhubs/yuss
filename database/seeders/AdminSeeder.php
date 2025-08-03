<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user if not exists
        if (!User::where('email', 'admin@sacco.local')->exists()) {
            User::create([
                'name' => 'System Administrator',
                'email' => 'admin@sacco.local',
                'email_verified_at' => now(),
                'password' => Hash::make('password'), // Change this in production
                'role' => 'admin',
                'is_verified' => true,
            ]);
        }

        // Create some sample quarters for the current year if not exists
        $currentYear = date('Y');

        if (DB::table('quarters')->where('year', $currentYear)->count() === 0) {
            $quarters = [
                [
                    'name' => "Q1 $currentYear",
                    'year' => $currentYear,
                    'quarter_number' => 1,
                    'start_date' => "$currentYear-01-01",
                    'end_date' => "$currentYear-03-31",
                    'status' => 'completed'
                ],
                [
                    'name' => "Q2 $currentYear",
                    'year' => $currentYear,
                    'quarter_number' => 2,
                    'start_date' => "$currentYear-05-01",
                    'end_date' => "$currentYear-07-31",
                    'status' => 'active'
                ],
                [
                    'name' => "Q3 $currentYear",
                    'year' => $currentYear,
                    'quarter_number' => 3,
                    'start_date' => "$currentYear-09-01",
                    'end_date' => "$currentYear-11-30",
                    'status' => 'upcoming'
                ],
            ];

            foreach ($quarters as $quarter) {
                DB::table('quarters')->insert(array_merge($quarter, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }
}
