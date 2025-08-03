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
        Schema::dropIfExists('individual_year_shares');
        Schema::dropIfExists('interest_distributions');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('member_committee_roles');
        Schema::dropIfExists('member_savings');
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('sacco_quarters');
        Schema::dropIfExists('sacco_years');
        Schema::dropIfExists('year_end_shareouts');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is irreversible as we're simplifying the system
    }
};
