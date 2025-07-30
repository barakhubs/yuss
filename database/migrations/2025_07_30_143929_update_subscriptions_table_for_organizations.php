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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Drop the existing user_id column and index
            $table->dropIndex(['user_id', 'stripe_status']);
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Add organization_id column
            $table->foreignId('organization_id')->after('id')->constrained()->onDelete('cascade');

            // Recreate the index with organization_id
            $table->index(['organization_id', 'stripe_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Drop the organization_id column and index
            $table->dropIndex(['organization_id', 'stripe_status']);
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');

            // Restore user_id column
            $table->foreignId('user_id')->after('id');
            $table->index(['user_id', 'stripe_status']);
        });
    }
};
