<?php

use App\Console\Commands\Sacco\AutoRepayLoans;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run auto loan deductions every day at midnight
Schedule::command('sacco:auto-repay-loans')->dailyAt('00:00');
