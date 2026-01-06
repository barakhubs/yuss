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
        Schema::table('loans', function (Blueprint $table) {
            $table->enum('loan_type', ['savings_loan', 'social_fund_loan', 'yukon_welfare_loan', 'school_fees_loan'])
                ->default('savings_loan')
                ->after('loan_number')
                ->comment('Type of loan: savings_loan, social_fund_loan, yukon_welfare_loan, or school_fees_loan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('loan_type');
        });
    }
};
