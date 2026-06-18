<?php

namespace App\Jobs;

use App\Services\LoanRepaymentService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessLoanRepayments implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $loanIds;
    public string $startDate;
    public string $endDate;
    public bool $dryRun;
    public $recordedBy;

    public function __construct(array $loanIds = [], string $startDate, string $endDate, bool $dryRun = true, $recordedBy = null)
    {
        $this->loanIds = $loanIds;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->dryRun = $dryRun;
        $this->recordedBy = $recordedBy;
        $this->onQueue('default');
    }

    public function handle(LoanRepaymentService $service)
    {
        $start = Carbon::parse($this->startDate);
        $end = Carbon::parse($this->endDate);

        return $service->createBatchDeductions($this->loanIds, $start, $end, $this->dryRun, $this->recordedBy);
    }
}
