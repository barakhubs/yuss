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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'chairperson', 'secretary', 'treasurer', 'disburser', 'member'])
                ->default('member')
                ->after('email_verified_at');
            $table->boolean('is_verified')->default(false)->after('role');
            $table->string('invitation_token')->nullable()->after('is_verified');
            $table->timestamp('invited_at')->nullable()->after('invitation_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_verified', 'invitation_token', 'invited_at']);
        });
    }
};
