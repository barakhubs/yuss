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
        // SACCO Financial Years Table
        Schema::create('sacco_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->integer('year');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->unique(['organization_id', 'year']);
        });

        // SACCO Quarters Table
        Schema::create('sacco_quarters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sacco_year_id')->constrained()->onDelete('cascade');
            $table->integer('quarter_number'); // 1, 2, 3
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();

            $table->unique(['sacco_year_id', 'quarter_number']);
        });

        // Member Committee Roles Table
        Schema::create('member_committee_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['chairperson', 'secretary', 'treasurer', 'disbursor']);
            $table->date('assigned_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['organization_id', 'user_id', 'role']);
        });

        // Member Savings Table
        Schema::create('member_savings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('sacco_quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->boolean('shared_out')->default(false);
            $table->date('shared_out_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'sacco_quarter_id']);
        });

        // Loans Table
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // borrower
            $table->foreignId('sacco_year_id')->constrained()->onDelete('cascade');
            $table->string('loan_number')->unique();
            $table->decimal('principal_amount', 10, 2);
            $table->decimal('interest_rate', 5, 2)->default(5.00); // 5%
            $table->decimal('total_amount', 10, 2); // principal + interest
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('outstanding_balance', 10, 2);
            $table->enum('status', ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'])->default('pending');
            $table->text('purpose')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('applied_date');
            $table->date('approved_date')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('disbursed_date')->nullable();
            $table->date('expected_repayment_date')->nullable();
            $table->date('actual_repayment_date')->nullable();
            $table->timestamps();
        });

        // Loan Repayments Table
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

        // Interest Distributions Table (tracks how interest is shared)
        Schema::create('interest_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('sacco_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // recipient
            $table->decimal('amount', 10, 2);
            $table->enum('distribution_type', ['loan_bearer_return', 'committee_share', 'member_share']);
            $table->text('description')->nullable();
            $table->date('distributed_date');
            $table->timestamps();
        });

        // Year-end Share-outs Table
        Schema::create('year_end_shareouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('sacco_year_id')->constrained()->onDelete('cascade');
            $table->decimal('total_interest_pool', 10, 2);
            $table->decimal('committee_total_share', 10, 2);
            $table->decimal('members_total_share', 10, 2);
            $table->boolean('is_completed')->default(false);
            $table->date('shareout_date')->nullable();
            $table->timestamps();
        });

        // Individual Year-end Shares Table
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('year_end_shareouts');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('member_savings');
        Schema::dropIfExists('member_committee_roles');
        Schema::dropIfExists('sacco_quarters');
        Schema::dropIfExists('sacco_years');
    }
};
