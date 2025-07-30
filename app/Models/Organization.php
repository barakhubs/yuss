<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Laravel\Cashier\Billable;

class Organization extends Model
{
    use HasFactory, Billable;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo',
        'website',
        'owner_id',
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'trial_ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($organization) {
            if (empty($organization->slug)) {
                $organization->slug = Str::slug($organization->name);
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Get the organization owner.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all users in the organization.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'organization_users')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Get organization admins.
     */
    public function admins()
    {
        return $this->users()->wherePivot('role', 'admin');
    }

    /**
     * Get organization members.
     */
    public function members()
    {
        return $this->users()->wherePivot('role', 'member');
    }

    /**
     * Get pending invitations for this organization.
     */
    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    /**
     * Get pending invitations for this organization.
     */
    public function pendingInvitations()
    {
        return $this->invitations()->whereNull('accepted_at');
    }

    /**
     * Check if the organization is on trial.
     */
    public function onTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    /**
     * Check if the organization has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscribed('default') || $this->onTrial();
    }

    /**
     * Add a user to the organization.
     */
    public function addUser(User $user, string $role = 'member')
    {
        // Prevent super admins from joining organizations
        if ($user->isSuperAdmin()) {
            throw new \Exception('Super admins cannot belong to organizations.');
        }

        // Prevent organization admins from joining multiple organizations
        if ($role === 'admin' && !$user->canJoinAsAdmin()) {
            if ($user->isOrganizationAdmin()) {
                throw new \Exception('Organization admins can only belong to one organization. Please leave your current organization first.');
            }
            if ($user->isSuperAdmin()) {
                throw new \Exception('Super admins cannot be organization admins.');
            }
        }

        return $this->users()->attach($user->id, [
            'role' => $role,
            'joined_at' => now(),
        ]);
    }

    /**
     * Remove a user from the organization.
     */
    public function removeUser(User $user)
    {
        return $this->users()->detach($user->id);
    }

    /**
     * Update a user's role in the organization.
     */
    public function updateUserRole(User $user, string $role)
    {
        // Prevent super admins from having organization roles
        if ($user->isSuperAdmin()) {
            throw new \Exception('Super admins cannot have organization roles.');
        }

        // Check if promoting to admin
        if ($role === 'admin' && !$user->canBePromotedToAdmin($this)) {
            if ($user->isOrganizationAdmin()) {
                throw new \Exception('User is already an admin of another organization. Organization admins can only belong to one organization.');
            }
        }

        return $this->users()->updateExistingPivot($user->id, ['role' => $role]);
    }

    /**
     * Get the subscriptions for the organization.
     * Override the Billable trait's subscriptions method to use the correct foreign key.
     */
    public function subscriptions()
    {
        return $this->hasMany(\Laravel\Cashier\Subscription::class, 'organization_id')->orderBy('created_at', 'desc');
    }
}
