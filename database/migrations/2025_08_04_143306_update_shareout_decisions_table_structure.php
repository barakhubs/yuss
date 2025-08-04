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
        Schema::table('shareout_decisions', function (Blueprint $table) {
            // Drop the old enum decision column
            $table->dropColumn(['decision', 'amount', 'decided_on']);

            // Add new columns to match the ShareoutDecision model
            $table->boolean('wants_shareout')->default(false);
            $table->decimal('savings_balance', 10, 2)->default(0);
            $table->decimal('interest_amount', 10, 2)->default(0);
            $table->boolean('shareout_completed')->default(false);
            $table->timestamp('decision_made_at')->nullable();
            $table->timestamp('shareout_completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shareout_decisions', function (Blueprint $table) {
            // Remove the new columns
            $table->dropForeign(['completed_by']);
            $table->dropColumn([
                'wants_shareout',
                'savings_balance',
                'interest_amount',
                'shareout_completed',
                'decision_made_at',
                'shareout_completed_at',
                'completed_by'
            ]);

            // Restore the old columns
            $table->enum('decision', ['save', 'withdraw'])->default('save');
            $table->decimal('amount', 10, 2);
            $table->date('decided_on');
        });
    }
};
