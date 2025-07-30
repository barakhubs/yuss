<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Billable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'github_id',
        'google_id',
        'timezone',
        'preferences',
        'is_super_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
            'last_login_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    /**
     * Get all organizations the user belongs to.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'organization_users')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Get organizations owned by the user.
     */
    public function ownedOrganizations()
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    /**
     * Get the user's current organization.
     */
    public function currentOrganization()
    {
        // This could be stored in session or determined by context
        return $this->organizations()->first();
    }

    /**
     * Check if user is admin of an organization.
     */
    public function isAdminOf(Organization $organization): bool
    {
        return $this->organizations()
            ->where('organization_id', $organization->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    /**
     * Check if user is an organization admin (has admin role in any organization).
     */
    public function isOrganizationAdmin(): bool
    {
        return $this->organizations()
            ->wherePivot('role', 'admin')
            ->exists();
    }

    /**
     * Get organizations where user is admin.
     */
    public function adminOrganizations()
    {
        return $this->organizations()
            ->wherePivot('role', 'admin');
    }

    /**
     * Check if user can join another organization as admin.
     */
    public function canJoinAsAdmin(): bool
    {
        // Organization admins can only belong to one organization
        return !$this->isOrganizationAdmin() && !$this->isSuperAdmin();
    }

    /**
     * Check if user can be promoted to admin in an organization.
     */
    public function canBePromotedToAdmin(Organization $organization): bool
    {
        // Must be a member of this organization and not admin of any other organization
        return $this->organizations()->where('organization_id', $organization->id)->exists()
            && !$this->isOrganizationAdmin()
            && !$this->isSuperAdmin();
    }

    /**
     * Check if user can create a new organization.
     */
    public function canCreateOrganization(): bool
    {
        // Users can only create organizations if they don't belong to any and are not super admins
        return !$this->organizations()->exists() && !$this->isSuperAdmin();
    }
    /**
     * Check if user is owner of an organization.
     */
    public function isOwnerOf(Organization $organization): bool
    {
        return $organization->owner_id === $this->id;
    }

    /**
     * Get invitations sent by this user.
     */
    public function sentInvitations()
    {
        return $this->hasMany(Invitation::class, 'invited_by');
    }

    /**
     * Check if the user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    /**
     * Make the user a super admin.
     */
    public function makeSuperAdmin(): void
    {
        // Super admins cannot belong to any organizations
        if ($this->organizations()->exists()) {
            throw new \Exception('Cannot make user a super admin while they belong to organizations. Please remove all organization memberships first.');
        }

        $this->update(['is_super_admin' => true]);
    }

    /**
     * Remove super admin privileges.
     */
    public function removeSuperAdmin(): void
    {
        $this->update(['is_super_admin' => false]);
    }

    /**
     * Remove user from all organizations (for super admin promotion).
     */
    public function removeFromAllOrganizations(): void
    {
        // Remove from organizations as member
        $this->organizations()->detach();

        // Transfer ownership of owned organizations to another user or handle accordingly
        $ownedOrgs = $this->ownedOrganizations;
        foreach ($ownedOrgs as $org) {
            // Find another member to transfer ownership to
            $newOwner = $org->users()->where('user_id', '!=', $this->id)->first();
            if ($newOwner) {
                $org->update(['owner_id' => $newOwner->id]);
            } else {
                // No other members, delete the organization
                $org->delete();
            }
        }
    }

    /**
     * Safely make user a super admin by removing all organization ties.
     */
    public function promoteToSuperAdmin(): void
    {
        $this->removeFromAllOrganizations();
        $this->makeSuperAdmin();
    }
}
