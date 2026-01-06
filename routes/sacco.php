<?php

use App\Http\Controllers\Sacco\DashboardController;
use App\Http\Controllers\Sacco\LoanController;
use App\Http\Controllers\Sacco\SavingsController;
use App\Http\Controllers\Sacco\MemberController;
use App\Http\Controllers\Sacco\QuarterController;
use Illuminate\Support\Facades\Route;

// SACCO Routes - Must be authenticated
Route::middleware(['auth', 'verified'])->prefix('sacco')->name('sacco.')->group(function () {

    // SACCO Dashboard - Accessible to all authenticated users
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ========================================================================
    // SHARED ROUTES (Different behavior for admin vs member)
    // ========================================================================

    // Loan Management - All users can view, but different actions based on role
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');

    // Savings Management - All users can view, but different actions based on role
    Route::get('/savings', [SavingsController::class, 'index'])->name('savings.index');
    Route::get('/savings/create', [SavingsController::class, 'create'])->name('savings.create');

    // Share-out management - Accessible to all, different views for admin/member
    Route::get('/savings/share-out', [SavingsController::class, 'shareOut'])->name('savings.share-out');
    Route::post('/savings/share-out/decision', [SavingsController::class, 'makeShareOutDecision'])->name('savings.share-out.decision');

    // ========================================================================
    // MEMBER-ONLY ROUTES
    // ========================================================================

    // Loan applications - Members only
    Route::get('/loan/create', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');

    // Savings targets - Members only
    Route::post('/savings/target', [SavingsController::class, 'storeTarget'])->name('savings.target.store');

    // ========================================================================
    // ADMIN/COMMITTEE-ONLY ROUTES
    // ========================================================================

    // Loan administration
    Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::post('/loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
    Route::post('/loans/{loan}/disburse', [LoanController::class, 'disburse'])->name('loans.disburse');
    Route::post('/loans/{loan}/repayment', [LoanController::class, 'recordRepayment'])->name('loans.repayment');

    // Savings administration
    Route::post('/savings', [SavingsController::class, 'store'])->name('savings.store');
    Route::post('/savings/initiate', [SavingsController::class, 'initiateMonthlySavings'])->name('savings.initiate');
    Route::post('/savings/preview', [SavingsController::class, 'previewMonthlySavings'])->name('savings.preview');
    Route::get('/savings/summary', [SavingsController::class, 'summary'])->name('savings.summary');

    // Share-out administration
    Route::post('/savings/share-out/activate', [SavingsController::class, 'activateShareOut'])->name('savings.share-out.activate');
    Route::post('/savings/share-out/complete', [SavingsController::class, 'completeShareOut'])->name('savings.share-out.complete');
    Route::post('/savings/share-out/bulk-complete', [SavingsController::class, 'bulkCompleteShareOut'])->name('savings.share-out.bulk-complete');

    // Member Management - Admin/Committee only
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::get('/members/create', [MemberController::class, 'create'])->name('members.create');
    Route::post('/members', [MemberController::class, 'store'])->name('members.store');
    Route::get('/members/{member}', [MemberController::class, 'show'])->name('members.show');
    Route::delete('/members/{user}', [MemberController::class, 'destroy'])->name('members.destroy');
    Route::patch('/members/{user}/activate', [MemberController::class, 'activate'])->name('members.activate');
    Route::patch('/members/{member}/category', [MemberController::class, 'updateCategory'])->name('members.update-category');

    // User Impersonation - Admin only
    Route::post('/members/{user}/impersonate', [MemberController::class, 'impersonate'])->name('members.impersonate');
    Route::post('/members/stop-impersonating', [MemberController::class, 'stopImpersonating'])->name('members.stop-impersonating');    // System Settings - Admin/Committee only
    Route::get('/settings/quarters', [QuarterController::class, 'index'])->name('settings.quarters');
    Route::post('/settings/quarters', [QuarterController::class, 'store'])->name('settings.quarters.store');
    Route::patch('/settings/quarters/{quarter}/activate', [QuarterController::class, 'setActive'])->name('settings.quarters.activate');
});
