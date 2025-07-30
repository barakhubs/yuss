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
            $table->string('avatar')->nullable()->after('email_verified_at');
            $table->string('github_id')->nullable()->after('avatar');
            $table->string('google_id')->nullable()->after('github_id');
            $table->string('timezone')->default('UTC')->after('google_id');
            $table->json('preferences')->nullable()->after('timezone');
            $table->timestamp('last_login_at')->nullable()->after('preferences');
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'github_id',
                'google_id',
                'timezone',
                'preferences',
                'last_login_at'
            ]);
            $table->string('password')->nullable(false)->change();
        });
    }
};
