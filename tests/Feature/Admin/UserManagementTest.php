<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $member;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an admin user (chairperson)
        $this->admin = User::factory()->create([
            'role' => 'chairperson',
            'is_verified' => true,
        ]);

        // Create a regular member that was created by admin
        $this->member = User::factory()->create([
            'role' => 'member',
            'is_verified' => true,
            'created_by_admin' => true,
        ]);
    }

    public function test_admin_can_create_user()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('sacco.members.store'), [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john.doe@example.com',
                'role' => 'member',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'send_credentials' => false,
            ]);

        $response->assertRedirect(route('sacco.members.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'email' => 'john.doe@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'role' => 'member',
            'is_verified' => true,
        ]);
    }

    public function test_non_admin_cannot_create_user()
    {
        $response = $this->actingAs($this->member)
            ->post(route('sacco.members.store'), [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john.doe@example.com',
                'role' => 'member',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_impersonate_member()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('sacco.members.impersonate', $this->member));

        $response->assertRedirect(route('sacco.dashboard'));
        $response->assertSessionHas('success');
        $response->assertSessionHas('impersonator_id', $this->admin->id);

        // Check that we're now authenticated as the member
        $this->assertEquals($this->member->id, Auth::id());
    }

    public function test_admin_cannot_impersonate_another_admin()
    {
        $anotherAdmin = User::factory()->create([
            'role' => 'chairperson',
            'is_verified' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('sacco.members.impersonate', $anotherAdmin));

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_member_cannot_impersonate_anyone()
    {
        $anotherMember = User::factory()->create([
            'role' => 'member',
            'is_verified' => true,
        ]);

        $response = $this->actingAs($this->member)
            ->post(route('sacco.members.impersonate', $anotherMember));

        $response->assertStatus(403);
    }

    public function test_can_stop_impersonating()
    {
        // Start impersonating
        $this->actingAs($this->admin)
            ->post(route('sacco.members.impersonate', $this->member));

        // Verify we're impersonating
        $this->assertEquals($this->member->id, Auth::id());

        // Stop impersonating
        $response = $this->post(route('sacco.members.stop-impersonating'));

        $response->assertRedirect(route('sacco.members.index'));
        $response->assertSessionHas('success');
        $response->assertSessionMissing('impersonator_id');

        // Check that we're back to the original admin
        $this->assertEquals($this->admin->id, Auth::id());
    }
}
