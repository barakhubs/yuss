<?php

/**
 * PostgreSQL Migration Verification Script
 * Run this script to verify PostgreSQL compatibility
 */

use App\Models\Quarter;
use App\Models\Saving;
use Illuminate\Support\Facades\DB;

// Test database connection
echo "Testing PostgreSQL connection...\n";
try {
    DB::connection()->getPdo();
    echo "✅ Database connection successful\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test UUID functionality
echo "\nTesting UUID functionality...\n";
try {
    $quarter = Quarter::first();
    if ($quarter && \Illuminate\Support\Str::isUuid($quarter->id)) {
        echo "✅ UUID primary keys working correctly\n";
    } else {
        echo "❌ UUID primary keys not working\n";
    }
} catch (Exception $e) {
    echo "❌ UUID test failed: " . $e->getMessage() . "\n";
}

// Test the converted date function
echo "\nTesting PostgreSQL date formatting...\n";
try {
    // Create a test query using the converted TO_CHAR function
    $result = DB::select("SELECT TO_CHAR(NOW(), 'YYYY-MM') as month");
    if (!empty($result)) {
        echo "✅ PostgreSQL TO_CHAR function working: " . $result[0]->month . "\n";
    } else {
        echo "❌ PostgreSQL TO_CHAR function failed\n";
    }
} catch (Exception $e) {
    echo "❌ Date formatting test failed: " . $e->getMessage() . "\n";
}

// Test savings query with the new PostgreSQL function
echo "\nTesting savings month query...\n";
try {
    $quarters = Quarter::all();
    if ($quarters->isNotEmpty()) {
        $quarter = $quarters->first();
        $completedMonths = Saving::where('quarter_id', $quarter->id)
            ->selectRaw("TO_CHAR(saved_on, 'YYYY-MM') as month")
            ->distinct()
            ->pluck('month')
            ->toArray();

        echo "✅ Savings month query successful. Found " . count($completedMonths) . " completed months\n";
        if (!empty($completedMonths)) {
            echo "   Months: " . implode(', ', $completedMonths) . "\n";
        }
    } else {
        echo "⚠️  No quarters found in database\n";
    }
} catch (Exception $e) {
    echo "❌ Savings query test failed: " . $e->getMessage() . "\n";
}

// Test queue tables
echo "\nTesting queue tables...\n";
try {
    DB::table('jobs')->count();
    echo "✅ Jobs table accessible\n";
} catch (Exception $e) {
    echo "❌ Jobs table test failed: " . $e->getMessage() . "\n";
}

try {
    DB::table('failed_jobs')->count();
    echo "✅ Failed jobs table accessible\n";
} catch (Exception $e) {
    echo "❌ Failed jobs table test failed: " . $e->getMessage() . "\n";
}

echo "\n🎉 PostgreSQL migration verification complete!\n";
echo "If all tests passed, your application is ready to use PostgreSQL.\n";
