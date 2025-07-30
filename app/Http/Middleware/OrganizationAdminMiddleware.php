<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OrganizationAdminMiddleware
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

        // Super admins are exempt from organization admin constraints
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user is trying to access organization admin features
        // while belonging to multiple organizations as admin
        if ($user->isOrganizationAdmin()) {
            $adminOrgCount = $user->adminOrganizations()->count();
            if ($adminOrgCount > 1) {
                abort(403, 'Organization admins can only belong to one organization. Please leave other organizations first.');
            }
        }

        return $next($request);
    }
}
