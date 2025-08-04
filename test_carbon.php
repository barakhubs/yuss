<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->boot();

echo "Testing Carbon date calculations...\n";

$current = now();
echo "Current date: " . $current->format('Y-m-d') . "\n";

// Test with integer (should work)
$result1 = $current->copy()->addMonths(3);
echo "With int (3): " . $result1->format('Y-m-d') . "\n";

// Test with string (should cause error before our fix)
try {
    $result2 = $current->copy()->addMonths('3');
    echo "With string ('3'): " . $result2->format('Y-m-d') . "\n";
} catch (Exception $e) {
    echo "Error with string: " . $e->getMessage() . "\n";
}

// Test our fix approach
$stringValue = '3';
$intValue = (int) $stringValue;
$result3 = $current->copy()->addMonths($intValue);
echo "With cast string ((int)'3'): " . $result3->format('Y-m-d') . "\n";

echo "Test complete.\n";
