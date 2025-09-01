<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class HandleImpersonation
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Add impersonation data to the request for frontend use
        if (Auth::check()) {
            $user = Auth::user();
            $impersonator = $user->getImpersonator();

            // Share impersonation status with Inertia
            if ($request->inertia()) {
                inertia()->share([
                    'impersonation' => [
                        'is_impersonating' => $user->isBeingImpersonated(),
                        'impersonator' => $impersonator ? [
                            'id' => $impersonator->id,
                            'name' => $impersonator->name,
                            'email' => $impersonator->email,
                        ] : null,
                        'impersonated_user' => $user->isBeingImpersonated() ? [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                        ] : null,
                    ],
                ]);
            }
        }

        return $next($request);
    }
}
