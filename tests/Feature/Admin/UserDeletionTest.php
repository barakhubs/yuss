<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_delete_user()
    {
        // Create a super admin
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        // Create a regular user created by admin
        $user = User::factory()->create([
            'role' => 'member',
            'created_by_admin' => true,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($superAdmin);

        $response = $this->delete(route('sacco.members.destroy', $user));

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_super_admin_cannot_delete_themselves()
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($superAdmin);

        $response = $this->delete(route('sacco.members.destroy', $superAdmin));

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
    }

    public function test_regular_admin_cannot_delete_user()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $user = User::factory()->create([
            'role' => 'member',
            'created_by_admin' => true,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin);

        $response = $this->delete(route('sacco.members.destroy', $user));

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_member_cannot_delete_user()
    {
        $member = User::factory()->create([
            'role' => 'member',
            'email_verified_at' => now(),
        ]);

        $otherUser = User::factory()->create([
            'role' => 'member',
            'created_by_admin' => true,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($member);

        $response = $this->delete(route('sacco.members.destroy', $otherUser));

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $otherUser->id]);
    }
}
