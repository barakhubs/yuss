<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PreventMultipleOrganizations
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Super admins cannot create or belong to organizations
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard')
                ->with('error', 'Super admins cannot create or belong to organizations.');
        }

        // Check if user already belongs to an organization
        if ($user->organizations()->exists()) {
            return redirect()->route('dashboard')
                ->with('error', 'You can only belong to one organization. Please leave your current organization before creating a new one.');
        }

        return $next($request);
    }
}
