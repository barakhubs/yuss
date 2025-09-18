<?php

namespace Tests\Feature\Permissions;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_chairperson_can_view_members_list()
    {
        $chairperson = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $secretary = User::factory()->create([
            'role' => 'secretary',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $member = User::factory()->create([
            'role' => 'member',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        // Chairperson should have access
        $this->actingAs($chairperson);
        $response = $this->get('/sacco/members');
        $response->assertStatus(200);

        // Secretary should NOT have access
        $this->actingAs($secretary);
        $response = $this->get('/sacco/members');
        $response->assertStatus(403);

        // Member should NOT have access
        $this->actingAs($member);
        $response = $this->get('/sacco/members');
        $response->assertStatus(403);
    }

    public function test_only_chairperson_can_approve_loans()
    {
        $chairperson = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $treasurer = User::factory()->create([
            'role' => 'treasurer',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $this->assertTrue($chairperson->canApproveLoans());
        $this->assertFalse($treasurer->canApproveLoans());
    }

    public function test_only_chairperson_can_disburse_loans()
    {
        $chairperson = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $disburser = User::factory()->create([
            'role' => 'disburser',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $this->assertTrue($chairperson->canDisburseLoans());
        $this->assertFalse($disburser->canDisburseLoans());
    }

    public function test_only_chairperson_can_impersonate_users()
    {
        $chairperson = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $secretary = User::factory()->create([
            'role' => 'secretary',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $member = User::factory()->create([
            'role' => 'member',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        // Chairperson should be able to impersonate
        $this->actingAs($chairperson);
        $response = $this->post(route('sacco.members.impersonate', $member));
        $response->assertRedirect(); // Should succeed

        // Secretary should NOT be able to impersonate
        $this->actingAs($secretary);
        $response = $this->post(route('sacco.members.impersonate', $member));
        $response->assertStatus(403);
    }

    public function test_only_chairperson_can_activate_users()
    {
        $chairperson = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $treasurer = User::factory()->create([
            'role' => 'treasurer',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        $invitedUser = User::factory()->create([
            'role' => 'member',
            'is_verified' => false,
            'invitation_token' => 'some-token',
        ]);

        // Chairperson should be able to activate
        $this->actingAs($chairperson);
        $response = $this->patch(route('sacco.members.activate', $invitedUser));
        $response->assertRedirect(); // Should succeed

        // Reset user state
        $invitedUser->update(['is_verified' => false]);

        // Treasurer should NOT be able to activate
        $this->actingAs($treasurer);
        $response = $this->patch(route('sacco.members.activate', $invitedUser));
        $response->assertStatus(403);
    }

    public function test_all_non_chairperson_roles_have_same_permissions()
    {
        $roles = ['secretary', 'treasurer', 'disburser', 'member'];

        foreach ($roles as $role) {
            $user = User::factory()->create([
                'role' => $role,
                'email_verified_at' => now(),
                'is_verified' => true,
            ]);

            // All should be treated as regular members (no admin privileges)
            $this->assertFalse($user->isAdmin());
            $this->assertFalse($user->canApproveLoans());
            $this->assertFalse($user->canDisburseLoans());

            // All should only see their own loans
            $this->actingAs($user);
            $response = $this->get('/sacco/loans');
            $response->assertStatus(200); // Can view loans page

            // But cannot view members list
            $response = $this->get('/sacco/members');
            $response->assertStatus(403);
        }
    }
}
