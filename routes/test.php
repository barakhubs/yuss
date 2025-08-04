<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

Route::get('/test-email', function () {
    try {
        Mail::raw('This is a test email from the SACCO system.', function ($message) {
            $message->to('test@example.com')
                ->subject('SACCO Test Email');
        });

        return 'Email sent successfully! Check your logs.';
    } catch (\Exception $e) {
        return 'Email failed: ' . $e->getMessage();
    }
});
