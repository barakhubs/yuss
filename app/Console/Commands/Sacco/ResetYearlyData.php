<?php

namespace App\Console\Commands\Sacco;

use App\Models\MemberSavingsTarget;
use App\Models\Saving;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetYearlyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sacco:reset-yearly-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resets all savings records and savings targets for a new year.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('Are you sure you want to reset all yearly savings data? This action is irreversible.')) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Resetting savings data...');

        $driver = DB::connection()->getDriverName();

        try {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            }

            // For PostgreSQL, TRUNCATE ... CASCADE will handle foreign keys.
            // For other databases, we'll just truncate.
            if ($driver === 'pgsql') {
                DB::statement('TRUNCATE TABLE ' . (new Saving)->getTable() . ' RESTART IDENTITY CASCADE');
                DB::statement('TRUNCATE TABLE ' . (new MemberSavingsTarget)->getTable() . ' RESTART IDENTITY CASCADE');
            } else {
                Saving::truncate();
                MemberSavingsTarget::truncate();
            }


            $this->info('All savings records have been deleted.');
            $this->info('All member savings targets have been deleted.');

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }

            $this->info('Yearly data reset successfully.');
        } catch (\Exception $e) {
            $this->error('An error occurred: ' . $e->getMessage());
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }
        }
    }
}
