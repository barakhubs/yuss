<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display the user creation form (Admin only)
     */
    public function create()
    {
        // Only chairperson can create users directly
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can create users directly.');
        }

        return Inertia::render('admin/users/Create');
    }

    /**
     * Store a new user created by admin
     */
    public function store(Request $request)
    {
        // Only chairperson can create users directly
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can create users directly.');
        }

        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:chairperson,secretary,treasurer,disburser,member'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'send_credentials' => ['boolean'],
        ]);

        // Create user directly without invitation
        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Optionally send credentials email (this would need a notification)
        if ($request->send_credentials) {
            // TODO: Implement credential notification
            // $user->notify(new UserCredentials($request->password));
        }

        return redirect()->route('sacco.members.index')
            ->with('success', "User {$user->name} created successfully!");
    }

    /**
     * Start impersonating a user (Admin only)
     */
    public function impersonate(User $user)
    {
        $currentUser = Auth::user();

        // Only chairperson can impersonate
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only chairperson can impersonate users.');
        }

        // Cannot impersonate yourself
        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot impersonate yourself.');
        }

        // Cannot impersonate other admins
        if ($user->isAdmin()) {
            return back()->with('error', 'You cannot impersonate other administrators.');
        }

        // Store the original user ID in session
        session(['impersonator_id' => $currentUser->id]);

        // Login as the target user
        Auth::login($user);

        return redirect()->route('sacco.dashboard')
            ->with('success', "You are now impersonating {$user->name}. Click 'Stop Impersonating' when done.");
    }

    /**
     * Stop impersonating and return to original user
     */
    public function stopImpersonating()
    {
        $impersonatorId = session('impersonator_id');

        if (!$impersonatorId) {
            return redirect()->route('sacco.dashboard')
                ->with('error', 'You are not currently impersonating anyone.');
        }

        $originalUser = User::find($impersonatorId);

        if (!$originalUser) {
            session()->forget('impersonator_id');
            return redirect()->route('login')
                ->with('error', 'Original user not found. Please login again.');
        }

        // Clear impersonation session
        session()->forget('impersonator_id');

        // Login as original user
        Auth::login($originalUser);

        return redirect()->route('sacco.members.index')
            ->with('success', 'Stopped impersonating. You are back to your original account.');
    }
}
