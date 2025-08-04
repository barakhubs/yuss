# SACCO Pages Organization

## New Structure

### Admin Pages (`/resources/js/Pages/Sacco/Admin/`)

These pages are only accessible to admin users (chairperson with admin privileges):

#### Savings Management

- `Admin/Savings/Create.tsx` - Monthly savings initiation and quarterly target management
- `Admin/Savings/ShareOut.tsx` - Admin share-out management (activate, complete, bulk operations)
- `Admin/Savings/Summary.tsx` - Admin savings summary and reporting

#### Member Management

- `Admin/Members/Index.tsx` - View and manage all SACCO members
- `Admin/Members/Show.tsx` - View individual member details and history

#### Settings

- `Admin/Settings/Quarters.tsx` - Create and manage SACCO quarters

### Member Pages (`/resources/js/Pages/Sacco/Member/`)

These pages are only accessible to regular members (non-admin users):

#### Savings

- `Member/Savings/SetTarget.tsx` - Set quarterly savings targets
- `Member/Savings/ShareOut.tsx` - Make share-out decisions (take or leave)

#### Loans

- `Member/Loans/Create.tsx` - Apply for loans

### Shared Pages (Different behavior for admin/member)

These pages are accessible to all users but show different content/actions based on user role:

#### Root Level

- `Dashboard.tsx` - Main dashboard (admin sees system metrics, members see personal metrics)

#### Savings

- `Savings/Index.tsx` - Savings overview (admin sees all members, members see personal savings)

#### Loans

- `Loans/Index.tsx` - Loans overview (admin manages all loans, members see personal loans)
- `Loans/Show.tsx` - Loan details (admin can approve/reject/disburse, members view only)

## Removed Pages

The following unused pages were removed:

- `Committees/Index.tsx` - No corresponding controller/routes
- `Committees/Create.tsx` - No corresponding controller/routes
- `Committees/Edit.tsx` - No corresponding controller/routes
- `Committees/Show.tsx` - No corresponding controller/routes
- `Savings/Create.tsx` - Replaced by SetTarget.tsx and AdminCreate.tsx

## Route Organization

The routes in `/routes/sacco.php` have been organized into three logical sections:

### Shared Routes

Routes accessible to all authenticated users, but with different behavior based on role:

- `GET /sacco/` - Dashboard (different metrics for admin/member)
- `GET /sacco/loans` - Loans overview (admin manages all, members see personal)
- `GET /sacco/loans/{loan}` - Loan details (admin can approve/reject, members view only)
- `GET /sacco/savings` - Savings overview (admin sees all members, members see personal)
- `GET /sacco/savings/create` - Savings management (admin panel vs member target setting)
- `GET /sacco/savings/share-out` - Share-out management (admin controls vs member decisions)

### Member-Only Routes

Routes that only regular members (non-admin) can access:

- `GET /sacco/loan/create` - Apply for loans
- `POST /sacco/loans` - Submit loan application
- `POST /sacco/savings/target` - Set quarterly savings targets
- `POST /sacco/savings/share-out/decision` - Make share-out decisions

### Admin/Committee-Only Routes

Routes that only admin users can access:

- `POST /sacco/loans/{loan}/approve` - Approve loan applications
- `POST /sacco/loans/{loan}/reject` - Reject loan applications
- `POST /sacco/loans/{loan}/disburse` - Disburse approved loans
- `POST /sacco/loans/{loan}/repayment` - Record loan repayments
- `POST /sacco/savings/initiate` - Initiate monthly savings
- `POST /sacco/savings/preview` - Preview monthly savings
- `GET /sacco/savings/summary` - View savings summary reports
- `POST /sacco/savings/share-out/activate` - Activate share-out process
- `POST /sacco/savings/share-out/complete` - Complete share-out process
- `POST /sacco/savings/share-out/bulk-complete` - Bulk complete share-outs
- `GET /sacco/members` - View all members
- `GET /sacco/members/{member}` - View member details
- `GET /sacco/settings/quarters` - Manage quarters
- `POST /sacco/settings/quarters` - Create quarters
- `PATCH /sacco/settings/quarters/{quarter}/activate` - Activate quarters

## Controller Updates

All controllers have been updated to reference the new file locations:

- `SavingsController.php` - Updated to use Admin/Savings/_ and Member/Savings/_ paths
- `MemberController.php` - Updated to use Admin/Members/\* paths
- `QuarterController.php` - Updated to use Admin/Settings/\* paths
- `LoanController.php` - Updated to use Member/Loans/\* paths

## Access Control

- Admin restrictions are enforced at both controller and UI level
- Admin users cannot access member-specific functionality (loan applications, savings targets)
- Member users cannot access admin-specific functionality (member management, system settings)
- Shared pages adapt their interface based on user role

## Benefits

1. **Clear Separation**: Admin and member functionality is clearly separated
2. **Better Security**: Role-based access is enforced consistently
3. **Maintainability**: Easier to find and maintain role-specific features
4. **Scalability**: Easy to add new admin or member features in their respective folders
5. **Clean Codebase**: Removed unused components and duplicate functionality
