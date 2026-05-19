<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL uses a text column with CHECK constraint
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_savings_category_check");
            DB::statement("ALTER TABLE users ALTER COLUMN savings_category TYPE VARCHAR(1)");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_savings_category_check CHECK (savings_category IN ('A','B','C','D','E'))");
        } else {
            // MySQL / SQLite
            Schema::table('users', function (Blueprint $table) {
                $table->enum('savings_category', ['A', 'B', 'C', 'D', 'E'])
                    ->nullable()
                    ->change();
            });
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_savings_category_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_savings_category_check CHECK (savings_category IN ('A','B','C'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('savings_category', ['A', 'B', 'C'])
                    ->nullable()
                    ->change();
            });
        }
    }
};
