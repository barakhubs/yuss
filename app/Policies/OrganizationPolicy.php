<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrganizationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Users can view their organizations
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Organization $organization): bool
    {
        return $user->organizations->contains($organization) || $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can create an organization
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization) || $user->isAdminOf($organization);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can manage users in the organization.
     */
    public function manageUsers(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization) || $user->isAdminOf($organization);
    }

    /**
     * Determine whether the user can manage billing for the organization.
     */
    public function manageBilling(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization) || $user->isAdminOf($organization);
    }
}
