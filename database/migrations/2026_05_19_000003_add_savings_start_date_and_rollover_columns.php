<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('savings_start_date')
                ->nullable()
                ->after('savings_category')
                ->comment('Date this member started saving — used for pro-rata target calculation on mid-quarter joins');
        });

        Schema::table('savings', function (Blueprint $table) {
            $table->boolean('rolled_over')->default(false)->after('notes');
            $table->foreignUuid('rolled_to_quarter_id')
                ->nullable()
                ->after('rolled_over')
                ->constrained('quarters')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('savings_start_date');
        });

        Schema::table('savings', function (Blueprint $table) {
            $table->dropForeign(['rolled_to_quarter_id']);
            $table->dropColumn(['rolled_over', 'rolled_to_quarter_id']);
        });
    }
};
