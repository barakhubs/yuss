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
        // Create users table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('role', ['admin', 'chairperson', 'secretary', 'treasurer', 'disburser', 'member'])
                ->default('member');
            $table->boolean('is_verified')->default(false);
            $table->string('invitation_token')->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->string('timezone')->default('UTC');
            $table->json('preferences')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Create password reset tokens table
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Create sessions table
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Create quarters table
        Schema::create('quarters', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'Q1 2025'
            $table->integer('year');
            $table->integer('quarter_number'); // 1, 2, or 3
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['upcoming', 'active', 'completed'])->default('upcoming');
            $table->timestamps();
        });

        // Create member savings targets table
        Schema::create('member_savings_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('target_amount', 10, 2);
            $table->timestamps();

            $table->unique(['user_id', 'quarter_id']);
        });

        // Create savings table
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

        // Create shareout decisions table
        Schema::create('shareout_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->enum('decision', ['continue_saving', 'partial_shareout', 'full_shareout']);
            $table->decimal('shareout_amount', 10, 2)->nullable();
            $table->timestamp('decided_at');
            $table->timestamps();

            $table->unique(['user_id', 'quarter_id']);
        });

        // Create loans table
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->decimal('interest_rate', 5, 2)->default(10.00); // 10% default
            $table->decimal('total_amount', 10, 2); // amount + interest
            $table->decimal('outstanding_balance', 10, 2);
            $table->foreignId('repayment_deadline_quarter_id')->constrained('quarters')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'disbursed', 'repaid', 'defaulted'])->default('pending');
            $table->text('purpose');
            $table->date('application_date');
            $table->timestamp('approval_date')->nullable();
            $table->timestamp('disbursement_date')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create loan repayments table
        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('payment_method')->default('cash');
            $table->foreignId('recorded_by')->constrained('users')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('shareout_decisions');
        Schema::dropIfExists('savings');
        Schema::dropIfExists('member_savings_targets');
        Schema::dropIfExists('quarters');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
