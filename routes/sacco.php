<?php

use App\Http\Controllers\Sacco\DashboardController;
use App\Http\Controllers\Sacco\LoanController;
use App\Http\Controllers\Sacco\SavingsController;
use App\Http\Controllers\Sacco\MemberController;
use App\Http\Controllers\Sacco\QuarterController;
use Illuminate\Support\Facades\Route;

// SACCO Routes - Must be authenticated
Route::middleware(['auth', 'verified'])->prefix('sacco')->name('sacco.')->group(function () {

    // SACCO Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Loan Management - All members can view and create
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/loans/create', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');

    // Admin/Committee-only loan actions
    Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::post('/loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
    Route::post('/loans/{loan}/disburse', [LoanController::class, 'disburse'])->name('loans.disburse');
    Route::post('/loans/{loan}/repayment', [LoanController::class, 'recordRepayment'])->name('loans.repayment');

    // Savings Management - All members can access
    Route::get('/savings', [SavingsController::class, 'index'])->name('savings.index');
    Route::get('/savings/create', [SavingsController::class, 'create'])->name('savings.create');
    Route::post('/savings', [SavingsController::class, 'store'])->name('savings.store');
    Route::post('/savings/target', [SavingsController::class, 'storeTarget'])->name('savings.target.store');
    Route::post('/savings/initiate', [SavingsController::class, 'initiateMonthlySavings'])->name('savings.initiate');
    Route::post('/savings/preview', [SavingsController::class, 'previewMonthlySavings'])->name('savings.preview');

    // Share-out management
    Route::get('/savings/share-out', [SavingsController::class, 'shareOut'])->name('savings.share-out');
    Route::post('/savings/share-out/activate', [SavingsController::class, 'activateShareOut'])->name('savings.share-out.activate');
    Route::post('/savings/share-out/decision', [SavingsController::class, 'makeShareOutDecision'])->name('savings.share-out.decision');
    Route::post('/savings/share-out/complete', [SavingsController::class, 'completeShareOut'])->name('savings.share-out.complete');
    Route::post('/savings/share-out/bulk-complete', [SavingsController::class, 'bulkCompleteShareOut'])->name('savings.share-out.bulk-complete');

    // Admin/Committee-only savings summary
    Route::get('/savings/summary', [SavingsController::class, 'summary'])->name('savings.summary');

    // Member Management - Admin/Committee only
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::get('/members/{member}', [MemberController::class, 'show'])->name('members.show');

    // Quarter Management - Admin/Committee only
    Route::get('/settings/quarters', [QuarterController::class, 'index'])->name('settings.quarters');
    Route::post('/settings/quarters', [QuarterController::class, 'store'])->name('settings.quarters.store');
    Route::patch('/settings/quarters/{quarter}/activate', [QuarterController::class, 'setActive'])->name('settings.quarters.activate');
});
