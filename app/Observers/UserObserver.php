<?php

namespace App\Observers;

use App\Models\MemberSavingsTarget;
use App\Models\Quarter;
use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        //
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // If the sacco_category is changed, set the savings target.
        if ($user->wasChanged('sacco_category') && $user->sacco_category) {
            $this->setSavingsTarget($user);
        }
    }

    /**
     * Set the member's savings target based on their SACCO category.
     */
    private function setSavingsTarget(User $user): void
    {
        $category = $user->sacco_category;
        $monthlySavings = config("sacco.categories.{$category}.monthly_savings");

        if ($monthlySavings) {
            $activeQuarter = Quarter::getCurrentQuarter();

            if ($activeQuarter) {
                MemberSavingsTarget::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'quarter_id' => $activeQuarter->id,
                    ],
                    [
                        'monthly_target' => $monthlySavings,
                    ]
                );
            }
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
