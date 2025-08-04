<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\UserInvited;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Show the form for inviting users.
     */
    public function create()
    {
        // Only chairperson can invite users
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can invite users.');
        }

        return Inertia::render('Invitations/Create');
    }

    /**
     * Send an invitation to join the SACCO.
     */
    public function store(Request $request)
    {
        // Only chairperson can invite users
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Only chairperson can invite users.');
        }

        $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:chairperson,secretary,treasurer,disburser,member'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        // Create user with invitation token
        $invitationToken = Str::random(64);

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make(Str::random(32)), // Temporary password
            'invitation_token' => $invitationToken,
            'invited_at' => now(),
            'is_verified' => false,
        ]);

        // Send invitation email
        $user->notify(new UserInvited($invitationToken));

        return redirect()->back()->with('success', 'Invitation sent successfully to ' . $user->email);
    }

    /**
     * Show the invitation acceptance form.
     */
    public function accept($token)
    {
        $user = User::where('invitation_token', $token)
            ->where('is_verified', false)
            ->first();

        if (!$user) {
            return redirect()->route('login')->with('error', 'Invalid or expired invitation link.');
        }

        return Inertia::render('auth/AcceptInvitation', [
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Complete the invitation process.
     */
    public function complete(Request $request, $token)
    {
        $user = User::where('invitation_token', $token)
            ->where('is_verified', false)
            ->first();

        if (!$user) {
            return redirect()->route('login')->with('error', 'Invalid or expired invitation link.');
        }

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Update user with new password and verify
        $user->update([
            'password' => Hash::make($request->password),
            'invitation_token' => null,
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Refresh the user model to ensure latest data
        $user->refresh();

        // Log the user in
        Auth::login($user);

        return redirect()->route('profile.edit')->with('success', 'Welcome to the SACCO! Please complete your profile.');
    }
}
