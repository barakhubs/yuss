<?php

use App\Http\Controllers\Sacco\DashboardController;
use App\Http\Controllers\Sacco\LoanController;
use App\Http\Controllers\Sacco\MemberController;
use App\Http\Controllers\Sacco\QuarterController;
use App\Http\Controllers\Sacco\SavingsController;
use App\Http\Controllers\Sacco\WelfareController;
use Illuminate\Support\Facades\Route;

// SACCO Routes - Must be authenticated
Route::middleware(['auth', 'verified', 'user.has.category'])->prefix('sacco')->name('sacco.')->group(function () {

    // SACCO Dashboard - Accessible to all authenticated users
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ========================================================================
    // SHARED ROUTES (Different behavior for admin vs member)
    // ========================================================================

    // Loan Management - All users can view, but different actions based on role
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');

    // Savings Management - All users can view, but different actions based on role
    Route::get('/savings', [SavingsController::class, 'index'])->name('savings.index');
    Route::get('/savings/create', [SavingsController::class, 'create'])->name('savings.create');

    // Share-out management - Accessible to all, different views for admin/member
    Route::get('/savings/share-out', [SavingsController::class, 'shareOut'])->name('savings.share-out');
    Route::post('/savings/share-out/decision', [SavingsController::class, 'makeShareOutDecision'])->name('savings.share-out.decision');

    // ========================================================================
    // MEMBER-ONLY ROUTES
    // ========================================================================

    // Loan applications - Members only
    Route::get('/loan/create', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');

    // Savings targets - Members only
    Route::post('/savings/target', [SavingsController::class, 'storeTarget'])->name('savings.target.store');

    // ========================================================================
    // ADMIN/COMMITTEE-ONLY ROUTES
    // ========================================================================

    // Loan administration
    Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::post('/loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
    Route::post('/loans/{loan}/disburse', [LoanController::class, 'disburse'])->name('loans.disburse');
    Route::post('/loans/{loan}/repayment', [LoanController::class, 'recordRepayment'])->name('loans.repayment');

    // Savings administration
    Route::post('/savings', [SavingsController::class, 'store'])->name('savings.store');
    Route::post('/savings/initiate', [SavingsController::class, 'initiateMonthlySavings'])->name('savings.initiate');
    Route::post('/savings/preview', [SavingsController::class, 'previewMonthlySavings'])->name('savings.preview');
    Route::get('/savings/summary', [SavingsController::class, 'summary'])->name('savings.summary');

    // Share-out administration
    Route::post('/savings/share-out/activate', [SavingsController::class, 'activateShareOut'])->name('savings.share-out.activate');
    Route::post('/savings/share-out/complete', [SavingsController::class, 'completeShareOut'])->name('savings.share-out.complete');
    Route::post('/savings/share-out/bulk-complete', [SavingsController::class, 'bulkCompleteShareOut'])->name('savings.share-out.bulk-complete');

    // Member Management - Admin/Committee only
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::get('/members/create', [MemberController::class, 'create'])->name('members.create');
    Route::post('/members', [MemberController::class, 'store'])->name('members.store');
    Route::get('/members/{member}', [MemberController::class, 'show'])->name('members.show');
    Route::delete('/members/{user}', [MemberController::class, 'destroy'])->name('members.destroy');
    Route::patch('/members/{user}/activate', [MemberController::class, 'activate'])->name('members.activate');
    Route::patch('/members/{user}/deactivate', [MemberController::class, 'deactivate'])->name('members.deactivate');
    Route::patch('/members/{member}/category', [MemberController::class, 'updateCategory'])->name('members.update-category');
    Route::patch('/members/{member}/savings-start-date', [MemberController::class, 'updateSavingsStartDate'])->name('members.update-savings-start-date');

    // User Impersonation - Admin only
    Route::post('/members/{user}/impersonate', [MemberController::class, 'impersonate'])->name('members.impersonate');
    Route::post('/members/stop-impersonating', [MemberController::class, 'stopImpersonating'])->name('members.stop-impersonating');    // System Settings - Admin/Committee only
    Route::get('/settings/quarters', [QuarterController::class, 'index'])->name('settings.quarters');
    Route::post('/settings/quarters', [QuarterController::class, 'store'])->name('settings.quarters.store');
    Route::patch('/settings/quarters/{quarter}/activate', [QuarterController::class, 'setActive'])->name('settings.quarters.activate');
    Route::post('/settings/quarters/rollover', [QuarterController::class, 'rolloverSavings'])->name('settings.quarters.rollover');

    // Welfare / Bereavement / Wedding Support - Admin only
    Route::get('/welfare', [WelfareController::class, 'index'])->name('welfare.index');
    Route::post('/welfare', [WelfareController::class, 'store'])->name('welfare.store');
    Route::post('/welfare/{claim}/pay', [WelfareController::class, 'markPaid'])->name('welfare.pay');
});

// =============================================================================
// UTILITY: Q1 2026 Savings Setup — editable mapping UI + execution
// Admin only. GET shows the review page; POST executes.
// =============================================================================
Route::middleware(['auth', 'verified'])->prefix('/sacco/util')->name('sacco.util.')->group(function () {

    // Shared member map definition (constitution → category)
    $buildMemberMap = function () {
        return [
            // Category A — €500/month
            ['label' => 'BARAKA MARK BRIGHT',      'search' => ['baraka', 'mark'],       'category' => 'A'],
            ['label' => 'IMAKIT MICHAEL',          'search' => ['imakit', 'michael'],   'category' => 'A'],
            ['label' => 'SEBABI SEMWEZI GODWIN',   'search' => ['sebabi', 'semwezi'],   'category' => 'A'],
            ['label' => 'BAZIRAKYE TONNY',         'search' => ['bazirakye', 'tonny'],  'category' => 'A'],
            ['label' => 'SAMUEL ITWARU',           'search' => ['samuel', 'itwaru'],    'category' => 'A'],
            // Category B — €300/month
            ['label' => 'ADROLE GLORIA',           'search' => ['adrole', 'gloria'],    'category' => 'B'],
            ['label' => 'AVINYIA KEVIN JOSHUA',    'search' => ['avinyia', 'kevin'],    'category' => 'B'],
            ['label' => 'MATURU JANET',            'search' => ['maturu', 'janet'],     'category' => 'B'],
            ['label' => 'ANDEOYE STEPHEN',         'search' => ['andeoye', 'stephen'],  'category' => 'B'],
            // Category C — €100/month
            ['label' => 'ANDEOYE PEACE MARION',   'search' => ['andeoye', 'peace'],     'category' => 'C'],
            ['label' => 'LEKURU RECHO',            'search' => ['lekuru', 'recho'],     'category' => 'C'],
            ['label' => 'BISASO BENJAMIN (Q1)',    'search' => ['bisaso', 'benjamin'],  'category' => 'C'],
            ['label' => 'BIDALI TOM',              'search' => ['bidali', 'tom'],       'category' => 'C'],
            ['label' => 'AHII SAMUEL',             'search' => ['ahii', 'samuel'],      'category' => 'C'],
            ['label' => 'EYOTRE GEORGE',           'search' => ['eyotre', 'george'],    'category' => 'C'],
            ['label' => 'IRENE EYONIZU',            'search' => ['irene', 'eyonizu'],    'category' => 'C'],
            ['label' => 'DANIEL ORYAMA',            'search' => ['daniel', 'oryama'],    'category' => 'C'],
            // Category D — €50/month
            ['label' => 'BURI ESTHER',             'search' => ['buri', 'esther'],      'category' => 'D'],
            // Category E — €25/month
            ['label' => 'AYOT NANCY',              'search' => ['ayot', 'nancy'],       'category' => 'E'],
            ['label' => 'TAMIA SUSAN',             'search' => ['tamia', 'susan'],      'category' => 'E'],
        ];
    };

    // ------------------------------------------------------------------
    // GET: render the review/edit page
    // ------------------------------------------------------------------
    Route::get('/reset-q1-2026-savings', function () use ($buildMemberMap) {
        $admin = \Illuminate\Support\Facades\Auth::user();
        if (!$admin->isAdmin()) abort(403);

        $q1 = \App\Models\Quarter::where('quarter_number', 1)->where('year', 2026)->first();

        // All verified members available for the user dropdowns (include chairperson — they save too)
        $allUsers = \App\Models\User::where('is_verified', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'created_at', 'savings_category', 'savings_start_date'])
            ->map(fn($u) => [
                'id'                 => $u->id,
                'name'               => $u->name,
                'email'              => $u->email,
                'created_at'         => $u->created_at->toDateString(),
                'savings_start_date' => $u->savings_start_date
                    ? \Carbon\Carbon::parse($u->savings_start_date)->toDateString()
                    : null,
                'savings_category'   => $u->savings_category,
            ]);

        // Build mapping with auto-matched suggestions
        $mapping = collect($buildMemberMap())->map(function ($spec, $index) use ($allUsers) {
            $query = \App\Models\User::where('role', '!=', 'chairperson');
            foreach ($spec['search'] as $word) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($word) . '%']);
            }
            $match = $query->first();
            return [
                'index'          => $index,
                'label'          => $spec['label'],
                'category'       => $spec['category'],
                'suggested_user_id'   => $match?->id,
                'suggested_user_name' => $match?->name,
                'auto_matched'   => $match !== null,
            ];
        })->values()->all();

        return \Inertia\Inertia::render('sacco/admin/util/ResetQ1Savings', [
            'mapping'  => $mapping,
            'allUsers' => $allUsers,
            'quarter'  => $q1 ? ['id' => $q1->id, 'name' => "Q1 {$q1->year}"] : null,
        ]);
    })->name('reset-q1-savings');

    // ------------------------------------------------------------------
    // POST: execute with the confirmed mapping from the frontend
    // ------------------------------------------------------------------
    Route::post('/reset-q1-2026-savings', function (\Illuminate\Http\Request $request) {
        $admin = \Illuminate\Support\Facades\Auth::user();
        if (!$admin->isAdmin()) abort(403);

        $request->validate([
            'mapping'              => ['required', 'array'],
            'mapping.*.user_id'    => ['nullable', 'exists:users,id'],
            'mapping.*.category'   => ['required', 'in:A,B,C,D,E'],
            'mapping.*.label'      => ['required', 'string'],
        ]);

        $q1 = \App\Models\Quarter::where('quarter_number', 1)->where('year', 2026)->firstOrFail();
        $q1Start = \Carbon\Carbon::create(2026, 1, 1);

        $results        = [];
        $savingsCreated = 0;

        foreach ($request->mapping as $entry) {
            if (empty($entry['user_id'])) {
                $results[] = ['label' => $entry['label'], 'status' => 'skipped', 'reason' => 'No user selected'];
                continue;
            }

            $dbUser = \App\Models\User::find($entry['user_id']);
            if (!$dbUser) continue;

            $category = $entry['category'];

            // Delete all existing savings for this member
            \App\Models\Saving::where('user_id', $dbUser->id)->delete();

            // Determine start month: prefer explicit savings_start_date, fall back to created_at
            $createdAt  = \Carbon\Carbon::parse($dbUser->created_at);
            $explicitStart = $dbUser->savings_start_date
                ? \Carbon\Carbon::parse($dbUser->savings_start_date)
                : null;
            $startDate = $explicitStart
                ? $explicitStart->copy()->startOfMonth()
                : ($createdAt->lt($q1Start) ? $q1Start->copy() : $createdAt->copy()->startOfMonth());

            $dbUser->update([
                'savings_category'   => $category,
                'savings_start_date' => $startDate->toDateString(),
            ]);

            if ($startDate->month > 4) {
                $results[] = [
                    'label' => $entry['label'],
                    'user' => $dbUser->name,
                    'status' => 'done',
                    'months' => 0,
                    'note' => 'Joined after Q1'
                ];
                continue;
            }

            $monthlyAmount = config("sacco.categories.{$category}.monthly_savings");
            $months        = 0;

            for ($month = $startDate->month; $month <= 4; $month++) {
                $savedOn = \Carbon\Carbon::create(2026, $month, 1)->endOfMonth()->toDateString();
                \App\Models\Saving::create([
                    'user_id'     => $dbUser->id,
                    'quarter_id'  => $q1->id,
                    'amount'      => $monthlyAmount,
                    'saved_on'    => $savedOn,
                    'notes'       => 'Q1 2026 monthly savings (reset utility)',
                    'recorded_by' => $admin->id,
                ]);
                $months++;
                $savingsCreated++;
            }

            $results[] = [
                'label'       => $entry['label'],
                'user'        => $dbUser->name,
                'category'    => $category,
                'status'      => 'done',
                'months'      => $months,
                'total_saved' => $monthlyAmount * $months,
            ];
        }

        return back()->with('success', "Done — {$savingsCreated} savings records created.")
            ->with('execution_results', $results);
    })->name('reset-q1-savings.execute');
});
