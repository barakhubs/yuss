<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserHasCategory
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var \App\Models\User */
        $user = Auth::user();

        // Skip category check for admins and super admins
        if ($user && ($user->isAdmin() || $user->isSuperAdmin())) {
            return $next($request);
        }

        // Ensure member has a savings category assigned
        if ($user && !$user->savings_category) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Please select a SACCO category to continue.'], 403);
            }
            return redirect()->route('profile.edit')->with('status', 'Please select a SACCO category to continue.');
        }

        return $next($request);
    }
}
