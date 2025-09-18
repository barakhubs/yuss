<?php

namespace Tests\Feature\Pagination;

use App\Models\User;
use App\Models\Loan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_pagination_works()
    {
        // Create an admin user
        $admin = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        // Create 25 members to test pagination (default is 20 per page)
        User::factory()->count(25)->create([
            'role' => 'member',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin);

        // Test first page
        $response = $this->get('/sacco/members');
        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) =>
            $page->component('sacco/admin/members/Index')
                ->has('members.data', 20) // Should have 20 members on first page
                ->where('members.current_page', 1)
                ->where('members.last_page', 2)
        );

        // Test second page
        $response = $this->get('/sacco/members?page=2');
        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) =>
            $page->has('members.data', 6) // Should have remaining 6 members on second page
                ->where('members.current_page', 2)
                ->where('members.last_page', 2)
        );
    }

    public function test_loans_pagination_works()
    {
        // Create an admin user
        $admin = User::factory()->create([
            'role' => 'chairperson',
            'email_verified_at' => now(),
            'is_verified' => true,
        ]);

        // Create some members
        $members = User::factory()->count(5)->create([
            'role' => 'member',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Create 20 loans to test pagination (default is 15 per page)
        foreach ($members as $member) {
            Loan::factory()->count(4)->create([
                'user_id' => $member->id,
            ]);
        }

        $this->actingAs($admin);

        // Test first page
        $response = $this->get('/sacco/loans');
        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) =>
            $page->component('sacco/loans/Index')
                ->has('loans.data', 15) // Should have 15 loans on first page
                ->where('loans.current_page', 1)
                ->where('loans.last_page', 2)
        );

        // Test second page
        $response = $this->get('/sacco/loans?page=2');
        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) =>
            $page->has('loans.data', 5) // Should have remaining 5 loans on second page
                ->where('loans.current_page', 2)
                ->where('loans.last_page', 2)
        );
    }
}
