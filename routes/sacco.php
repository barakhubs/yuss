<?php

use App\Http\Controllers\Sacco\CommitteeController;
use App\Http\Controllers\Sacco\DashboardController;
use App\Http\Controllers\Sacco\LoanController;
use App\Http\Controllers\Sacco\SavingsController;
use Illuminate\Support\Facades\Route;

// SACCO Routes - Must be authenticated and organization member
Route::middleware(['auth', 'verified'])->prefix('sacco')->name('sacco.')->group(function () {

    // SACCO Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Loan Management
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/loans/create', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');

    // Admin-only loan actions
    Route::middleware(['can:manageUsers,App\Models\Organization'])->group(function () {
        Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
        Route::post('/loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
        Route::post('/loans/{loan}/disburse', [LoanController::class, 'disburse'])->name('loans.disburse');
        Route::post('/loans/{loan}/repayment', [LoanController::class, 'recordRepayment'])->name('loans.repayment');
    });

    // Savings Management
    Route::get('/savings', [SavingsController::class, 'index'])->name('savings.index');
    Route::get('/savings/create', [SavingsController::class, 'create'])->name('savings.create');
    Route::post('/savings', [SavingsController::class, 'store'])->name('savings.store');
    Route::post('/savings/share-out', [SavingsController::class, 'shareOut'])->name('savings.share-out');

    // Admin-only savings summary
    Route::middleware(['can:manageUsers,App\Models\Organization'])->group(function () {
        Route::get('/savings/summary', [SavingsController::class, 'summary'])->name('savings.summary');
    });

    // Committee Management
    Route::get('/committees', [CommitteeController::class, 'index'])->name('committees.index');
    Route::get('/committees/create', [CommitteeController::class, 'create'])->name('committees.create');
    Route::post('/committees', [CommitteeController::class, 'store'])->name('committees.store');
    Route::get('/committees/{committee}', [CommitteeController::class, 'show'])->name('committees.show');
    Route::get('/committees/{committee}/edit', [CommitteeController::class, 'edit'])->name('committees.edit');
    Route::patch('/committees/{committee}', [CommitteeController::class, 'update'])->name('committees.update');
    Route::delete('/committees/{committee}', [CommitteeController::class, 'destroy'])->name('committees.destroy');
    Route::post('/committees/{committee}/members', [CommitteeController::class, 'addMember'])->name('committees.members.store');
    Route::delete('/committees/{committee}/members/{member}', [CommitteeController::class, 'removeMember'])->name('committees.members.destroy');
});
