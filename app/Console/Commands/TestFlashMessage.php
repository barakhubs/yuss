<?php

namespace App\Console\Commands;

use App\Models\Quarter;
use Illuminate\Console\Command;

class TestFlashMessage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:flash';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test flash messages by temporarily setting all quarters to inactive';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Temporarily set all quarters to upcoming to test the error message
        $this->info('Setting all quarters to upcoming to test error message...');
        Quarter::query()->update(['status' => 'upcoming']);

        $this->info('All quarters set to upcoming. Try accessing the savings create page to see the error message.');
        $this->info('Run "php artisan quarters:check" to restore an active quarter.');
    }
}
