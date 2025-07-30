# Organization Admin Constraints

## Overview

This SaaS template implements strict constraints for organization admins to maintain clear organizational boundaries and prevent conflicts of interest.

## Key Rules

### 1. **Organization Admin Single-Organization Rule**

- Organization admins can only belong to **one organization** at a time
- This prevents conflicts of interest and ensures focused responsibility
- Super admins are exempt from this rule as they oversee all organizations

### 2. **Role Hierarchy**

```
Super Admin (global oversight, no organization membership)
    ↓
Organization Owner (owns organization, inherits admin privileges)
    ↓
Organization Admin (manages organization, limited to one org)
    ↓
Organization Member (basic access)
```

## Implementation Details

### Backend Constraints

#### User Model Methods

- `canJoinAsAdmin()` - Checks if user can become admin in another organization
- `canBePromotedToAdmin()` - Validates promotion to admin role
- `isOrganizationAdmin()` - Checks if user has admin role anywhere
- `adminOrganizations()` - Returns organizations where user is admin

#### Organization Model Methods

- `addUser($user, $role)` - Validates role constraints before adding
- `updateUserRole($user, $role)` - Enforces single-admin rule on role changes

#### Middleware Protection

- `OrganizationAdminMiddleware` - Validates admin constraints on each request
- Applied to all organization-related routes

### Frontend Warnings

#### Dashboard Warnings

- Shows admin status warnings for users with admin roles
- Explains the single-organization constraint

#### Organization Page Warnings

- Displays role-specific information
- Alerts users about admin limitations

### Error Handling

#### Common Error Messages

- "Organization admins can only belong to one organization"
- "User is already an admin of another organization"
- "Super admins cannot be organization admins"

## Usage Examples

### Promoting a User to Admin

```php
// This will fail if user is admin elsewhere
try {
    $organization->updateUserRole($user, 'admin');
} catch (\Exception $e) {
    // Handle: User already admin elsewhere
}
```

### Inviting an Admin

```php
// Invitation acceptance will fail if user is admin elsewhere
$invitation = Invitation::create([
    'role' => 'admin', // Will be validated on acceptance
    // ...
]);
```

### Checking Admin Status

```php
if ($user->canJoinAsAdmin()) {
    // User can become admin
} else {
    // User is either already admin elsewhere or is super admin
}
```

## Business Logic

### Why This Constraint?

1. **Prevents Conflicts**: Admins can't have divided loyalties
2. **Clear Responsibility**: Each admin focuses on one organization
3. **Data Security**: Reduces risk of cross-organization data access
4. **Billing Clarity**: Simplifies organization-based billing models

### Exceptions

- **Super Admins**: Can view all organizations but cannot belong to any
- **Organization Owners**: Automatically have admin privileges but can own multiple organizations

## Migration Path

### Existing Multi-Admin Users

The system includes migration helpers to handle existing users who may be admins in multiple organizations:

```bash
# Check for conflicts
php artisan user:admin-conflicts

# Resolve conflicts by choosing primary organization
php artisan user:resolve-admin-conflicts {email} {primary_org_id}
```

## API Responses

### Validation Errors

```json
{
    "error": "Organization admins can only belong to one organization. Please leave your current organization first.",
    "code": "ADMIN_MULTI_ORG_CONSTRAINT"
}
```

### Success Responses

```json
{
    "message": "User role updated successfully",
    "user_role": "admin",
    "organization": "Acme Corp"
}
```

This constraint system ensures clean organizational boundaries while maintaining flexibility for super admin oversight.
