<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:make-super-admin {email} {--remove : Remove super admin privileges instead of granting them} {--force : Force promotion by removing from all organizations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Grant or remove super admin privileges for a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $remove = $this->option('remove');
        $force = $this->option('force');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }

        if ($remove) {
            if (!$user->is_super_admin) {
                $this->info("User '{$email}' is not a super admin.");
                return 0;
            }

            $user->removeSuperAdmin();
            $this->info("Super admin privileges removed from '{$email}'.");
        } else {
            if ($user->is_super_admin) {
                $this->info("User '{$email}' is already a super admin.");
                return 0;
            }

            // Check if user belongs to organizations
            $orgCount = $user->organizations()->count();
            if ($orgCount > 0) {
                if (!$force) {
                    $this->error("User '{$email}' belongs to {$orgCount} organization(s). Use --force to remove them from all organizations and promote to super admin.");
                    return 1;
                }

                $this->warn("User belongs to {$orgCount} organization(s). Removing from all organizations...");
                try {
                    $user->promoteToSuperAdmin();
                    $this->info("Super admin privileges granted to '{$email}' and removed from all organizations.");
                } catch (\Exception $e) {
                    $this->error("Failed to promote user: " . $e->getMessage());
                    return 1;
                }
            } else {
                $user->makeSuperAdmin();
                $this->info("Super admin privileges granted to '{$email}'.");
            }
        }

        return 0;
    }
}
