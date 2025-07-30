<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public invitation routes
Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');

Route::middleware(['auth', 'verified', 'org_admin'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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

    // Subscription routes
    Route::get('organizations/{organization}/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::get('organizations/{organization}/subscriptions/create', [SubscriptionController::class, 'create'])->name('subscriptions.create');
    Route::post('organizations/{organization}/subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
    Route::patch('organizations/{organization}/subscriptions', [SubscriptionController::class, 'update'])->name('subscriptions.update');
    Route::delete('organizations/{organization}/subscriptions', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
    Route::post('organizations/{organization}/subscriptions/resume', [SubscriptionController::class, 'resume'])->name('subscriptions.resume');
    Route::get('organizations/{organization}/billing-portal', [SubscriptionController::class, 'portal'])->name('subscriptions.portal');
});

// Organization creation routes (with additional middleware to prevent multiple organizations)
Route::middleware(['auth', 'verified', 'prevent_multiple_orgs'])->group(function () {
    Route::get('organizations/create', [OrganizationController::class, 'create'])->name('organizations.create');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
});

// Super Admin Routes
Route::middleware(['auth', 'verified', 'super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/organizations', [SuperAdminController::class, 'organizations'])->name('organizations');
    Route::get('/users', [SuperAdminController::class, 'users'])->name('users');
    Route::get('/organizations/{organization}', [SuperAdminController::class, 'viewOrganization'])->name('organizations.show');
    Route::post('/organizations/{organization}/suspend', [SuperAdminController::class, 'suspendOrganization'])->name('organizations.suspend');
    Route::delete('/organizations/{organization}', [SuperAdminController::class, 'deleteOrganization'])->name('organizations.delete');
    Route::post('/users/{user}/toggle-super-admin', [SuperAdminController::class, 'toggleSuperAdmin'])->name('users.toggle-super-admin');
    Route::post('/users/{user}/force-promote', [SuperAdminController::class, 'forcePromoteToSuperAdmin'])->name('users.force-promote');

    // Plans management
    Route::resource('plans', \App\Http\Controllers\SuperAdmin\PlanController::class);
});

// Stripe webhooks (outside of auth middleware)
Route::post('/stripe/webhook', [SubscriptionController::class, 'webhook'])->name('stripe.webhook');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
