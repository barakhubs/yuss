<?php

namespace App\Console\Commands;

use App\Models\Quarter;
use Illuminate\Console\Command;

class CheckQuarters extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quarters:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and create quarters if needed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Checking quarters...");
        $quarters = Quarter::all();
        $this->info("Total quarters: " . $quarters->count());

        if ($quarters->count() > 0) {
            foreach ($quarters as $q) {
                $this->line("Q{$q->quarter_number} {$q->year} - {$q->status}");
            }
        } else {
            $this->info("No quarters found. Creating current quarter...");
            $currentYear = date('Y');
            $currentMonth = date('n');
            $currentQuarter = ceil($currentMonth / 3);

            // Calculate quarter start and end dates
            $quarterStartMonth = ($currentQuarter - 1) * 3 + 1;
            $quarterEndMonth = $currentQuarter * 3;

            $startDate = date('Y-m-01', mktime(0, 0, 0, $quarterStartMonth, 1, $currentYear));
            $endDate = date('Y-m-t', mktime(0, 0, 0, $quarterEndMonth, 1, $currentYear));

            $quarter = Quarter::create([
                'name' => "Q{$currentQuarter} {$currentYear}",
                'year' => $currentYear,
                'quarter_number' => $currentQuarter,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active'
            ]);

            $this->info("Created: Q{$quarter->quarter_number} {$quarter->year} - {$quarter->status}");
        }

        $activeQuarters = Quarter::where('status', 'active')->get();
        $this->info("Active quarters: " . $activeQuarters->count());

        if ($activeQuarters->count() === 0 && $quarters->count() > 0) {
            // Set the most recent quarter to active
            $mostRecentQuarter = Quarter::orderBy('year', 'desc')
                ->orderBy('quarter_number', 'desc')
                ->first();

            $mostRecentQuarter->update(['status' => 'active']);
            $this->info("Set Q{$mostRecentQuarter->quarter_number} {$mostRecentQuarter->year} to active status");
        }

        foreach ($activeQuarters as $q) {
            $this->line("- Q{$q->quarter_number} {$q->year}");
        }

        // Show the final active quarters count
        $finalActiveQuarters = Quarter::where('status', 'active')->get();
        if ($finalActiveQuarters->count() > 0) {
            $this->info("Final active quarters:");
            foreach ($finalActiveQuarters as $q) {
                $this->line("- Q{$q->quarter_number} {$q->year}");
            }
        }
    }
}
