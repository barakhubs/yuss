<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo',
        'website',
        'owner_id',
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
     * Add a user to the organization.
     */
    public function addUser(User $user, string $role = 'member')
    {
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
        return $this->users()->updateExistingPivot($user->id, ['role' => $role]);
    }
}
