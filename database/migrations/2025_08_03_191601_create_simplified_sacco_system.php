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
        // Drop old organization-based tables if they exist
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('year_end_shareouts');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('member_savings');
        Schema::dropIfExists('member_committee_roles');
        Schema::dropIfExists('sacco_quarters');
        Schema::dropIfExists('sacco_years');

        // Create quarters table (simplified - no organization_id)
        if (!Schema::hasTable('quarters')) {
            Schema::create('quarters', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // e.g., 'Q1 2025'
                $table->integer('year');
                $table->integer('quarter_number'); // 1, 2, or 3
                $table->date('start_date');
                $table->date('end_date');
                $table->enum('status', ['upcoming', 'active', 'completed'])->default('upcoming');
                $table->timestamps();

                $table->unique(['year', 'quarter_number']);
            });
        }

        // Create member savings targets table
        if (!Schema::hasTable('member_savings_targets')) {
            Schema::create('member_savings_targets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
                $table->decimal('target_amount', 10, 2);
                $table->timestamps();

                $table->unique(['user_id', 'quarter_id']);
            });
        }

        // Create savings table
        if (!Schema::hasTable('savings')) {
            Schema::create('savings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
                $table->decimal('amount', 10, 2);
                $table->date('saved_on');
                $table->foreignId('recorded_by')->constrained('users')->onDelete('cascade');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Create shareout decisions table
        if (!Schema::hasTable('shareout_decisions')) {
            Schema::create('shareout_decisions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
                $table->enum('decision', ['save', 'withdraw'])->default('save');
                $table->decimal('amount', 10, 2);
                $table->date('decided_on');
                $table->timestamps();

                $table->unique(['user_id', 'quarter_id']);
            });
        }

        // Update loans table structure if it exists, or create it
        if (Schema::hasTable('loans')) {
            // Loans table exists, update its structure to match our simplified system
            Schema::table('loans', function (Blueprint $table) {
                // Remove organization_id if it exists
                if (Schema::hasColumn('loans', 'organization_id')) {
                    $table->dropForeign(['organization_id']);
                    $table->dropColumn('organization_id');
                }

                // Remove sacco_year_id if it exists and add quarter_id
                if (Schema::hasColumn('loans', 'sacco_year_id')) {
                    $table->dropForeign(['sacco_year_id']);
                    $table->dropColumn('sacco_year_id');
                }

                if (!Schema::hasColumn('loans', 'quarter_id')) {
                    $table->foreignId('quarter_id')->after('user_id')->constrained()->onDelete('cascade');
                }

                // Remove interest_rate column if it exists (now fixed at 5%)
                if (Schema::hasColumn('loans', 'interest_rate')) {
                    $table->dropColumn('interest_rate');
                }

                // Rename principal_amount to amount if needed
                if (Schema::hasColumn('loans', 'principal_amount')) {
                    $table->renameColumn('principal_amount', 'amount');
                }

                // Add repayment_deadline_quarter_id if it doesn't exist
                if (!Schema::hasColumn('loans', 'repayment_deadline_quarter_id')) {
                    $table->foreignId('repayment_deadline_quarter_id')->nullable()->constrained('quarters')->onDelete('set null');
                }
            });
        } else {
            Schema::create('loans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade'); // borrower
                $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
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
                $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
                $table->date('disbursed_date')->nullable();
                $table->date('expected_repayment_date')->nullable();
                $table->date('actual_repayment_date')->nullable();
                $table->foreignId('repayment_deadline_quarter_id')->nullable()->constrained('quarters')->onDelete('set null');
                $table->timestamps();
            });
        }

        // Create loan repayments table
        if (!Schema::hasTable('loan_repayments')) {
            Schema::create('loan_repayments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('loan_id')->constrained()->onDelete('cascade');
                $table->decimal('amount', 10, 2);
                $table->decimal('principal_portion', 10, 2);
                $table->decimal('interest_portion', 10, 2);
                $table->date('payment_date');
                $table->string('payment_method')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Create interest distributions table (simplified)
        if (!Schema::hasTable('interest_distributions')) {
            Schema::create('interest_distributions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
                $table->foreignId('loan_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade'); // recipient
                $table->decimal('amount', 10, 2);
                $table->enum('distribution_type', ['loan_bearer_return', 'committee_share', 'member_share']);
                $table->text('description')->nullable();
                $table->date('distributed_date');
                $table->timestamps();
            });
        }

        // Create year-end share-outs table (simplified)
        if (!Schema::hasTable('year_end_shareouts')) {
            Schema::create('year_end_shareouts', function (Blueprint $table) {
                $table->id();
                $table->integer('year');
                $table->decimal('total_interest_pool', 10, 2);
                $table->decimal('committee_total_share', 10, 2);
                $table->decimal('members_total_share', 10, 2);
                $table->boolean('is_completed')->default(false);
                $table->date('shareout_date')->nullable();
                $table->timestamps();

                $table->unique(['year']);
            });
        }

        // Create individual year-end shares table (simplified)
        if (!Schema::hasTable('individual_year_shares')) {
            Schema::create('individual_year_shares', function (Blueprint $table) {
                $table->id();
                $table->foreignId('year_end_shareout_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->decimal('amount', 10, 2);
                $table->enum('share_type', ['committee_member', 'regular_member']);
                $table->boolean('is_disbursed')->default(false);
                $table->date('disbursed_date')->nullable();
                $table->timestamps();
            });
        }

        // Add SACCO-specific fields to users table if they don't exist
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'chairperson', 'secretary', 'treasurer', 'disburser', 'member'])
                    ->default('member')->after('email_verified_at');
            });
        }

        if (!Schema::hasColumn('users', 'is_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_verified')->default(false)->after('role');
            });
        }

        if (!Schema::hasColumn('users', 'invitation_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('invitation_token')->nullable()->after('is_verified');
            });
        }

        if (!Schema::hasColumn('users', 'invited_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('invited_at')->nullable()->after('invitation_token');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop SACCO tables
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('year_end_shareouts');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('shareout_decisions');
        Schema::dropIfExists('savings');
        Schema::dropIfExists('member_savings_targets');
        Schema::dropIfExists('quarters');

        // Remove SACCO fields from users table
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        if (Schema::hasColumn('users', 'is_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_verified');
            });
        }

        if (Schema::hasColumn('users', 'invitation_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('invitation_token');
            });
        }

        if (Schema::hasColumn('users', 'invited_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('invited_at');
            });
        }
    }
};
