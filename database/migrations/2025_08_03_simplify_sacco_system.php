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
        // Drop organization-related tables and simplify to single organization
        Schema::dropIfExists('organization_users');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('invitations');

        // Drop committee tables since we're removing committee module
        Schema::dropIfExists('committee_members');
        Schema::dropIfExists('committees');

        // Simplify users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['super_admin']);
            $table->enum('role', ['admin', 'chairperson', 'secretary', 'treasurer', 'disburser', 'member'])->default('member');
            $table->boolean('is_verified')->default(false);
            $table->string('invitation_token')->nullable();
            $table->timestamp('invited_at')->nullable();
        });

        // Create simplified quarters table (3 quarters per year)
        Schema::create('quarters', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->integer('quarter'); // 1, 2, 3
            $table->date('start_date');
            $table->date('end_date');
            $table->date('shareout_date'); // 4th month
            $table->enum('status', ['upcoming', 'active', 'shareout', 'completed'])->default('upcoming');
            $table->timestamps();

            $table->unique(['year', 'quarter']);
        });

        // Create member savings targets table
        Schema::create('member_savings_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('monthly_target', 10, 2);
            $table->timestamps();

            $table->unique(['user_id', 'quarter_id']);
        });

        // Create actual savings records
        Schema::create('savings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->integer('month'); // 1, 2, 3 for each quarter
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at');
            $table->foreignId('recorded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Create shareout decisions table
        Schema::create('shareout_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->boolean('wants_shareout')->default(false);
            $table->decimal('savings_balance', 10, 2);
            $table->decimal('interest_amount', 10, 2)->default(0);
            $table->boolean('shareout_completed')->default(false);
            $table->timestamp('decision_made_at')->nullable();
            $table->timestamp('shareout_completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->unique(['user_id', 'quarter_id']);
        });

        // Simplify loans table
        Schema::dropIfExists('loans');
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->decimal('interest_rate', 5, 2)->default(5.00);
            $table->decimal('total_amount', 10, 2);
            $table->integer('repayment_months'); // max 4
            $table->enum('status', ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'])->default('pending');
            $table->text('purpose')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('application_date');
            $table->date('approval_date')->nullable();
            $table->date('disbursement_date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('remaining_balance', 10, 2);
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // Simplify loan repayments
        Schema::dropIfExists('loan_repayments');
        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a major restructuring, reversal would be complex
        // In production, you would need a more sophisticated rollback
    }
};
