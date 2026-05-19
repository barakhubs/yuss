<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('welfare_claims', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('claimed_by')->constrained('users')->cascadeOnDelete();
            $table->enum('claim_type', ['bereavement', 'wedding', 'ceremonial_introduction']);
            $table->date('event_date');
            $table->string('beneficiary_name');
            $table->text('notes')->nullable();
            $table->decimal('group_contribution', 10, 2)->default(0);
            $table->decimal('yukon_contribution', 10, 2)->default(0);
            $table->decimal('total_payout', 10, 2)->default(0);
            $table->enum('status', ['initiated', 'paid'])->default('initiated');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('welfare_claims');
    }
};
