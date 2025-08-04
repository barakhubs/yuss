<?php

use App\Http\Controllers\InvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public invitation routes
Route::get('/invitation/accept/{token}', [InvitationController::class, 'accept'])->name('invitation.accept');
Route::post('/invitation/complete/{token}', [InvitationController::class, 'complete'])->name('invitation.complete');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('sacco.dashboard');
    })->name('dashboard');

    // Simplified invitation routes (chairperson only)
    Route::middleware('can:invite-users')->group(function () {
        Route::get('invitations/create', [InvitationController::class, 'create'])->name('invitations.create');
        Route::post('invitations', [InvitationController::class, 'store'])->name('invitations.store');
    });
});

// Include SACCO routes
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/sacco.php';
