<?php

use App\Http\Controllers\InvitationController;
use App\Http\Controllers\OrganizationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public invitation routes
Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('sacco.dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'org_admin'])->group(function () {
    // Organization routes (except create)
    Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::get('organizations/create', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::get('organizations/{organization}', [OrganizationController::class, 'show'])->name('organizations.show');
    Route::get('organizations/{organization}/edit', [OrganizationController::class, 'edit'])->name('organizations.edit');
    Route::patch('organizations/{organization}', [OrganizationController::class, 'update'])->name('organizations.update');
    Route::delete('organizations/{organization}', [OrganizationController::class, 'destroy'])->name('organizations.destroy');
    Route::post('organizations/{organization}/switch', [OrganizationController::class, 'switch'])->name('organizations.switch');
    Route::delete('organizations/{organization}/users', [OrganizationController::class, 'removeUser'])->name('organizations.users.remove');
    Route::patch('organizations/{organization}/users/role', [OrganizationController::class, 'updateUserRole'])->name('organizations.users.role');

    // Invitation routes
    Route::get('organizations/{organization}/invitations/create', [InvitationController::class, 'create'])->name('invitations.create');
    Route::post('organizations/{organization}/invitations', [InvitationController::class, 'store'])->name('invitations.store');
    Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend'])->name('invitations.resend');
    Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->name('invitations.destroy');
});

// Organization creation routes (with additional middleware to prevent multiple organizations)
Route::middleware(['auth', 'verified', 'prevent_multiple_orgs'])->group(function () {
    Route::get('organizations/create', [OrganizationController::class, 'create'])->name('organizations.create');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
});

// Include SACCO routes
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/sacco.php';
