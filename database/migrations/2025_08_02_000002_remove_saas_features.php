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
        // Remove super admin and social auth columns from users
        if (Schema::hasColumn('users', 'is_super_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_super_admin');
            });
        }

        if (Schema::hasColumn('users', 'github_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('github_id');
            });
        }

        if (Schema::hasColumn('users', 'google_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('google_id');
            });
        }

        // Remove stripe/billing columns from users
        if (Schema::hasColumn('users', 'stripe_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn([
                    'stripe_id',
                    'pm_type',
                    'pm_last_four',
                    'trial_ends_at'
                ]);
            });
        }

        // Drop subscription-related tables if they exist
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_items');

        // Drop permission tables if they exist
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back subscription-related columns to organizations
        Schema::table('organizations', function (Blueprint $table) {
            $table->unsignedBigInteger('plan_id')->nullable()->after('owner_id');
            $table->string('paddle_id')->nullable()->after('plan_id');
            $table->string('pm_type')->nullable()->after('paddle_id');
            $table->string('pm_last_four', 4)->nullable()->after('pm_type');
            $table->timestamp('trial_ends_at')->nullable()->after('pm_last_four');
        });

        // Add back columns to users
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('preferences');
            $table->string('github_id')->nullable()->after('is_super_admin');
            $table->string('google_id')->nullable()->after('github_id');
        });
    }
};
