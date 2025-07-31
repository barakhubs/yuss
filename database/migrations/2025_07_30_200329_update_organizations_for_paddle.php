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
        Schema::table('organizations', function (Blueprint $table) {
            // Check if stripe_id column exists before renaming
            if (Schema::hasColumn('organizations', 'stripe_id')) {
                $table->renameColumn('stripe_id', 'legacy_stripe_id');
            }

            // Add paddle_id if it doesn't exist
            if (!Schema::hasColumn('organizations', 'paddle_id')) {
                $table->string('paddle_id')->nullable()->after('plan_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'legacy_stripe_id')) {
                $table->renameColumn('legacy_stripe_id', 'stripe_id');
            }
            if (Schema::hasColumn('organizations', 'paddle_id')) {
                $table->dropColumn('paddle_id');
            }
        });
    }
};
