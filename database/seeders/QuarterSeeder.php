<?php

namespace Database\Seeders;

use App\Models\Quarter;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class QuarterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing quarters
        Quarter::truncate();

        $years = [2024, 2025, 2026]; // Seed quarters for multiple years

        foreach ($years as $year) {
            $this->createQuartersForYear($year);
        }
    }

    private function createQuartersForYear(int $year): void
    {
        $quarters = [
            [
                'quarter_number' => 1,
                'name' => "Q1 {$year}",
                'start_date' => Carbon::create($year, 1, 1),
                'end_date' => Carbon::create($year, 4, 30),
                'status' => $this->getQuarterStatus($year, 1),
            ],
            [
                'quarter_number' => 2,
                'name' => "Q2 {$year}",
                'start_date' => Carbon::create($year, 5, 1),
                'end_date' => Carbon::create($year, 8, 31),
                'status' => $this->getQuarterStatus($year, 2),
            ],
            [
                'quarter_number' => 3,
                'name' => "Q3 {$year}",
                'start_date' => Carbon::create($year, 9, 1),
                'end_date' => Carbon::create($year, 12, 31),
                'status' => $this->getQuarterStatus($year, 3),
            ],
        ];

        foreach ($quarters as $quarterData) {
            Quarter::create([
                'name' => $quarterData['name'],
                'year' => $year,
                'quarter_number' => $quarterData['quarter_number'],
                'start_date' => $quarterData['start_date'],
                'end_date' => $quarterData['end_date'],
                'status' => $quarterData['status'],
            ]);
        }
    }

    private function getQuarterStatus(int $year, int $quarter): string
    {
        $now = Carbon::now();
        $currentYear = $now->year;
        $currentMonth = $now->month;

        // Determine current quarter based on month
        $currentQuarter = 1;
        if ($currentMonth >= 5 && $currentMonth <= 8) {
            $currentQuarter = 2;
        } elseif ($currentMonth >= 9 && $currentMonth <= 12) {
            $currentQuarter = 3;
        }

        if ($year < $currentYear) {
            return 'completed';
        } elseif ($year > $currentYear) {
            return 'upcoming';
        } else {
            // Same year
            if ($quarter < $currentQuarter) {
                return 'completed';
            } elseif ($quarter > $currentQuarter) {
                return 'upcoming';
            } else {
                return 'active';
            }
        }
    }
}
