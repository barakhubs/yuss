<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->boot();

echo "Checking quarters...\n";
$quarters = \App\Models\Quarter::all();
echo "Total quarters: " . $quarters->count() . "\n";

if ($quarters->count() > 0) {
    foreach ($quarters as $q) {
        echo "Q{$q->quarter_number} {$q->year} - {$q->status}\n";
    }
} else {
    echo "No quarters found. Creating current quarter...\n";
    $currentYear = date('Y');
    $currentMonth = date('n');
    $currentQuarter = ceil($currentMonth / 3);

    // Calculate quarter start and end dates
    $quarterStartMonth = ($currentQuarter - 1) * 3 + 1;
    $quarterEndMonth = $currentQuarter * 3;

    $startDate = date('Y-m-01', mktime(0, 0, 0, $quarterStartMonth, 1, $currentYear));
    $endDate = date('Y-m-t', mktime(0, 0, 0, $quarterEndMonth, 1, $currentYear));

    $quarter = \App\Models\Quarter::create([
        'name' => "Q{$currentQuarter} {$currentYear}",
        'year' => $currentYear,
        'quarter_number' => $currentQuarter,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'status' => 'active'
    ]);

    echo "Created: Q{$quarter->quarter_number} {$quarter->year} - {$quarter->status}\n";
}

$activeQuarters = \App\Models\Quarter::where('status', 'active')->get();
echo "Active quarters: " . $activeQuarters->count() . "\n";
foreach ($activeQuarters as $q) {
    echo "- Q{$q->quarter_number} {$q->year}\n";
}
