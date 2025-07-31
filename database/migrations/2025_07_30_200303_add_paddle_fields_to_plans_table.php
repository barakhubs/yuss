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
        Schema::table('plans', function (Blueprint $table) {
            $table->string('paddle_price_id')->nullable()->after('stripe_price_id');
            $table->renameColumn('stripe_price_id', 'legacy_stripe_price_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->renameColumn('legacy_stripe_price_id', 'stripe_price_id');
            $table->dropColumn('paddle_price_id');
        });
    }
};
