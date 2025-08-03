<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the form for creating an invitation.
     */
    public function create(Organization $organization)
    {
        $this->authorize('manageUsers', $organization);

        return inertia('Invitations/Create', [
            'organization' => $organization,
        ]);
    }

    /**
     * Send an invitation to join an organization.
     */
    public function store(Request $request, Organization $organization)
    {
        $this->authorize('manageUsers', $organization);

        $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'in:admin,member'],
        ]);

        // Check if user is already a member
        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser && $organization->users()->where('user_id', $existingUser->id)->exists()) {
            return back()->with('error', 'User is already a member of this organization.');
        }

        // Check if there's already a pending invitation
        $existingInvitation = $organization->pendingInvitations()
            ->where('email', $request->email)
            ->first();

        if ($existingInvitation) {
            return back()->with('error', 'An invitation has already been sent to this email.');
        }

        // Create invitation
        $invitation = Invitation::create([
            'organization_id' => $organization->id,
            'invited_by' => Auth::id(),
            'email' => $request->email,
            'role' => $request->role,
        ]);

        // Send invitation email
        $this->sendInvitationEmail($invitation);

        return back()->with('success', 'Invitation sent successfully!');
    }

    /**
     * Show the invitation acceptance page.
     */
    public function show(string $token)
    {
        $invitation = Invitation::where('token', $token)
            ->with(['organization', 'invitedBy'])
            ->firstOrFail();

        if ($invitation->accepted_at) {
            return redirect('/dashboard')->with('error', 'This invitation has already been accepted.');
        }

        if ($invitation->isExpired()) {
            return redirect('/')->with('error', 'This invitation has expired.');
        }

        return inertia('Invitations/Show', [
            'invitation' => $invitation,
        ]);
    }

    /**
     * Accept an invitation.
     */
    public function accept(Request $request, string $token)
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        if ($invitation->accepted_at) {
            return redirect('/dashboard')->with('error', 'This invitation has already been accepted.');
        }

        if ($invitation->isExpired()) {
            return redirect('/')->with('error', 'This invitation has expired.');
        }

        $user = Auth::user();

        // If user is not authenticated, they need to register/login first
        if (!$user) {
            session(['invitation_token' => $token]);
            return redirect('/register')->with('message', 'Please create an account to accept the invitation.');
        }

        // Check if the invitation email matches the user's email
        if ($user->email !== $invitation->email) {
            return back()->with('error', 'This invitation was sent to a different email address.');
        }

        // Add user to organization
        try {
            $invitation->organization->addUser($user, $invitation->role);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        // Mark invitation as accepted
        $invitation->accept();

        return redirect('/dashboard')->with('success', "Welcome to {$invitation->organization->name}!");
    }

    /**
     * Resend an invitation.
     */
    public function resend(Invitation $invitation)
    {
        $this->authorize('manageUsers', $invitation->organization);

        if ($invitation->accepted_at) {
            return back()->with('error', 'This invitation has already been accepted.');
        }

        // Update expiration date
        $invitation->update([
            'expires_at' => now()->addDays(7),
            'token' => Str::random(64), // Generate new token for security
        ]);

        $this->sendInvitationEmail($invitation);

        return back()->with('success', 'Invitation resent successfully!');
    }

    /**
     * Cancel an invitation.
     */
    public function destroy(Invitation $invitation)
    {
        $this->authorize('manageUsers', $invitation->organization);

        $invitation->delete();

        return back()->with('success', 'Invitation cancelled successfully!');
    }

    /**
     * Send invitation email.
     */
    private function sendInvitationEmail(Invitation $invitation)
    {
        // TODO: Implement email sending
        // For now, we'll just log the invitation URL
        $url = url("/invitations/{$invitation->token}");
        Log::info("Invitation sent to {$invitation->email}: {$url}");
    }
}
