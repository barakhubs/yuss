<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop existing tables and recreate with UUID primary keys
        $this->dropExistingTables();
        $this->createTablesWithUuid();
    }

    private function dropExistingTables(): void
    {
        // Drop SACCO tables in reverse dependency order
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('year_end_shareouts');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('shareout_decisions');
        Schema::dropIfExists('savings');
        Schema::dropIfExists('member_savings_targets');
        Schema::dropIfExists('quarters');

        // Drop organization/subscription tables
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('organization_users');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_items');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('plans');

        // Drop permission tables
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');

        // Update users table to use UUID
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Drop columns only if they exist
                $columnsToCheck = [
                    'role',
                    'is_verified',
                    'invitation_token',
                    'invited_at',
                    'is_super_admin',
                    'avatar',
                    'github_id',
                    'google_id',
                    'timezone',
                    'preferences',
                    'last_login_at',
                ];

                $columnsToRemove = [];
                foreach ($columnsToCheck as $column) {
                    if (Schema::hasColumn('users', $column)) {
                        $columnsToRemove[] = $column;
                    }
                }

                if (!empty($columnsToRemove)) {
                    $table->dropColumn($columnsToRemove);
                }
            });

            // Recreate users table with UUID
            Schema::drop('users');
        }
    }

    private function createTablesWithUuid(): void
    {
        // Create users table with UUID
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'chairperson', 'secretary', 'treasurer', 'disburser', 'member'])
                ->default('member');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_super_admin')->default(false);
            $table->string('invitation_token')->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->string('avatar')->nullable();
            $table->string('github_id')->nullable();
            $table->string('google_id')->nullable();
            $table->string('timezone')->default('UTC');
            $table->json('preferences')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Create quarters table with UUID
        Schema::create('quarters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // e.g., 'Q1 2025'
            $table->integer('year');
            $table->integer('quarter_number'); // 1, 2, or 3
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['upcoming', 'active', 'completed', 'inactive'])->default('upcoming');
            $table->boolean('shareout_activated')->default(false);
            $table->date('shareout_date')->nullable()
                ->comment('Date when the shareout for this quarter is scheduled');
            $table->timestamps();

            $table->unique(['year', 'quarter_number']);
        });

        // Create member savings targets table with UUID
        Schema::create('member_savings_targets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('quarter_id');
            $table->decimal('monthly_target', 10, 2);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('quarter_id')->references('id')->on('quarters')->onDelete('cascade');
            $table->unique(['user_id', 'quarter_id']);
        });

        // Create savings table with UUID
        Schema::create('savings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('quarter_id');
            $table->decimal('amount', 10, 2);
            $table->date('saved_on');
            $table->uuid('recorded_by');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('quarter_id')->references('id')->on('quarters')->onDelete('cascade');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('cascade');
        });

        // Create shareout decisions table with UUID
        Schema::create('shareout_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('quarter_id');
            $table->boolean('wants_shareout')->default(false);
            $table->decimal('savings_balance', 10, 2)->default(0);
            $table->decimal('interest_amount', 10, 2)->default(0);
            $table->boolean('shareout_completed')->default(false);
            $table->timestamp('decision_made_at')->nullable();
            $table->timestamp('shareout_completed_at')->nullable();
            $table->uuid('completed_by')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('quarter_id')->references('id')->on('quarters')->onDelete('cascade');
            $table->foreign('completed_by')->references('id')->on('users')->onDelete('set null');
            $table->unique(['user_id', 'quarter_id']);
        });

        // Create loans table with UUID
        Schema::create('loans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // borrower
            $table->uuid('quarter_id');
            $table->string('loan_number')->unique();
            $table->decimal('amount', 10, 2); // principal amount
            $table->decimal('total_amount', 10, 2); // principal + interest
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('outstanding_balance', 10, 2);
            $table->enum('status', ['pending', 'approved', 'disbursed', 'completed', 'rejected'])->default('pending');
            $table->text('purpose')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('applied_date');
            $table->date('approved_date')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->date('disbursed_date')->nullable();
            $table->date('expected_repayment_date')->nullable(); // Calculated using 22nd day rule
            $table->date('actual_repayment_date')->nullable();
            $table->uuid('repayment_deadline_quarter_id')->nullable();
            $table->integer('repayment_period_months')->nullable()
                ->comment('Number of months selected for repayment when applying for the loan');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('quarter_id')->references('id')->on('quarters')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('repayment_deadline_quarter_id')->references('id')->on('quarters')->onDelete('set null');
        });

        // Create loan repayments table with UUID
        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('loan_id');
            $table->decimal('amount', 10, 2);
            $table->decimal('principal_portion', 10, 2);
            $table->decimal('interest_portion', 10, 2);
            $table->date('payment_date');
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('loan_id')->references('id')->on('loans')->onDelete('cascade');
        });

        // Create interest distributions table with UUID
        Schema::create('interest_distributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quarter_id');
            $table->uuid('loan_id');
            $table->uuid('user_id'); // recipient
            $table->decimal('amount', 10, 2);
            $table->enum('distribution_type', ['loan_bearer_return', 'committee_share', 'member_share']);
            $table->text('description')->nullable();
            $table->date('distributed_date');
            $table->timestamps();

            $table->foreign('quarter_id')->references('id')->on('quarters')->onDelete('cascade');
            $table->foreign('loan_id')->references('id')->on('loans')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Create year-end share-outs table with UUID
        Schema::create('year_end_shareouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('year');
            $table->decimal('total_interest_pool', 10, 2);
            $table->decimal('committee_total_share', 10, 2);
            $table->decimal('members_total_share', 10, 2);
            $table->boolean('is_completed')->default(false);
            $table->date('shareout_date')->nullable();
            $table->timestamps();

            $table->unique(['year']);
        });

        // Create individual year-end shares table with UUID
        Schema::create('individual_year_shares', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('year_end_shareout_id');
            $table->uuid('user_id');
            $table->decimal('amount', 10, 2);
            $table->enum('share_type', ['committee_member', 'regular_member']);
            $table->boolean('is_disbursed')->default(false);
            $table->date('disbursed_date')->nullable();
            $table->timestamps();

            $table->foreign('year_end_shareout_id')->references('id')->on('year_end_shareouts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Create invitations table with UUID
        Schema::create('invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invited_by');
            $table->string('email');
            $table->string('role')->default('member');
            $table->string('token')->unique();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('invited_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a destructive migration, down would require recreating with integer IDs
        // For now, we'll just drop everything as the user mentioned they can reset data

        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('subscription_items');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('organization_users');
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('year_end_shareouts');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('shareout_decisions');
        Schema::dropIfExists('savings');
        Schema::dropIfExists('member_savings_targets');
        Schema::dropIfExists('quarters');
        Schema::dropIfExists('users');
    }
};
