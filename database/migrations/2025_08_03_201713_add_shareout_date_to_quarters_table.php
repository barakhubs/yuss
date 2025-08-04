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
        Schema::table('quarters', function (Blueprint $table) {
            $table->date('shareout_date')->nullable()->after('end_date')
                ->comment('Date when the shareout for this quarter is scheduled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quarters', function (Blueprint $table) {
            $table->dropColumn('shareout_date');
        });
    }
};
