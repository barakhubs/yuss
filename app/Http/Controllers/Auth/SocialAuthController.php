<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to social provider.
     */
    public function redirect(string $provider)
    {
        $this->validateProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    /**
     * Handle callback from social provider.
     */
    public function callback(string $provider)
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'Authentication failed.');
        }

        $user = $this->findOrCreateUser($socialUser, $provider);

        Auth::login($user);

        // Update last login time
        $user->update(['last_login_at' => now()]);

        return redirect()->intended('/dashboard');
    }

    /**
     * Find or create user from social provider data.
     */
    private function findOrCreateUser($socialUser, string $provider): User
    {
        // Check if user exists with this provider ID
        $providerField = $provider . '_id';
        $user = User::where($providerField, $socialUser->id)->first();

        if ($user) {
            return $user;
        }

        // Check if user exists with this email
        $user = User::where('email', $socialUser->email)->first();

        if ($user) {
            // Link this provider to existing user
            $user->update([
                $providerField => $socialUser->id,
                'avatar' => $socialUser->avatar ?? $user->avatar,
            ]);
            return $user;
        }

        // Create new user
        return User::create([
            'name' => $socialUser->name,
            'email' => $socialUser->email,
            'avatar' => $socialUser->avatar,
            $providerField => $socialUser->id,
            'email_verified_at' => now(), // Social accounts are considered verified
        ]);
    }

    /**
     * Validate the provider.
     */
    private function validateProvider(string $provider): void
    {
        if (!in_array($provider, ['github', 'google'])) {
            abort(404);
        }
    }
}
