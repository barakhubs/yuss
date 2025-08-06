<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): RedirectResponse
    {
        // Registration is disabled - users must be invited
        return redirect()->route('login')
            ->with('error', 'Registration is disabled. Please contact an administrator for an invitation.');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Registration is disabled - users must be invited
        return redirect()->route('login')
            ->with('error', 'Registration is disabled. Please contact an administrator for an invitation.');
    }
}
