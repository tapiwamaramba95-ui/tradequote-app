# Staff Permissions & Invitation System Implementation

## Overview
Complete implementation of role-based access control (RBAC) for staff members with invitation workflow, permission toggles, and page protection.

## Components Created

### 1. Database Migration
**File:** `db/migrations/20260326_staff_permissions_and_invitation.sql`

Adds to the `staff` table:
- `permissions` (JSONB) - Stores 12 permission flags
- `invited_at` (timestamp) - Tracks when invitation email was sent
- `accepted_at` (timestamp) - Tracks when user accepted invitation
- GIN index on `permissions` for fast queries
- `has_staff_permission()` database function for server-side checks

**12 Permission Keys:**
1. `timesheets` - View and manage timesheets
2. `jobs` - Access job management
3. `invoicing` - Create and manage invoices
4. `quoting` - Create and manage quotes
5. `purchases` - Access purchase orders and suppliers
6. `reports_financials` - View financial reports and analytics
7. `scheduling_dispatch` - Manage schedules and dispatch
8. `enquiries` - View and respond to enquiries
9. `staff_tracking` - Track staff locations/activity
10. `settings` - Access business settings
11. `staff_members` - Manage staff members
12. `plan_billing` - Manage subscription and billing

### 2. Permission Types
**File:** `lib/permissions/types.ts`

- `PermissionKey` - Union type of all 12 permission keys
- `StaffPermissions` - Mapped type (all keys to boolean)
- `PERMISSION_DEFINITIONS` - Array with labels and descriptions
- `DEFAULT_PERMISSIONS` - Limited access for new staff
- `OWNER_PERMISSIONS` - Full access for account owners

### 3. Permission Checking Utilities
**File:** `lib/permissions/check.ts`

Functions:
- `getCurrentUserPermissions()` - Returns user's full permission set
- `hasPermission(key)` - Checks single permission
- `hasAnyPermission(keys[])` - Checks if has any of multiple
- `hasAllPermissions(keys[])` - Checks if has all of multiple
- `isBusinessOwner()` - Special check for Owner role (bypasses all restrictions)

### 4. Permission Toggle Component
**File:** `components/permissions/PermissionToggle.tsx`

UI component displaying toggle switches for each of the 12 permissions. Features:
- Staff member name header
- Description for each permission
- Toggle switches with orange accent color
- Loading state during save
- Styled with Tailwind CSS

### 5. Permission Guard Component
**File:** `components/permissions/PermissionGuard.tsx`

Wrapper component for protecting pages. Features:
- Checks permissions before rendering children
- Shows loading spinner during check
- Displays "Access Denied" page if permission fails
- Owners bypass all restrictions
- Supports single permission or array of permissions (anyOf)

Usage:
```tsx
<PermissionGuard permission="invoicing">
  <InvoicesPage />
</PermissionGuard>

<PermissionGuard anyOf={['settings', 'staff_members']}>
  <SettingsPage />
</PermissionGuard>
```

### 6. Invitation Acceptance Page
**File:** `app/auth/accept-invite/page.tsx`

Page where invited staff members:
- Verify invitation token from email
- Create their password
- Activate their account
- Update `accepted_at` timestamp and `is_active` flag
- Redirected to dashboard after success

### 7. Updated Staff Members Page
**File:** `app/settings/staff-members/page.tsx`

Enhanced with:
- Two-tab modal (Personal Info + Permissions)
- `PermissionToggle` component integration
- Invitation status badges (Pending/Active/Not Invited)
- "Resend Invite" button for pending invitations
- Email field disabled after invitation sent
- Saves permissions to JSONB column

**Note:** Invitation email sending requires server-side API route with service role key. Currently creates staff record with placeholder for invitation workflow.

### 8. Navigation Filtering
**File:** `app/dashboard/layout.tsx`

Updated with:
- Permission-based navigation filtering
- Each nav item mapped to required permission
- Dashboard and Clients always visible (no permission required)
- Owners see all navigation items
- `filteredNavigation` array based on user's permissions

**Navigation Permission Mapping:**
- Dashboard → No permission required
- Jobs → `jobs`
- Enquiries → `enquiries`
- Clients → No permission required
- Quotes → `quoting`
- Invoices → `invoicing`
- Schedule → `scheduling_dispatch`
- Purchase Orders → `purchases`
- Suppliers → `purchases`
- Timesheets → `timesheets`
- Analytics → `reports_financials`
- Settings → `settings`

## Implementation Status

✅ **Completed:**
- Database schema with permissions and invitation tracking
- Permission type definitions and utilities
- Permission toggle UI component
- Permission guard for page protection
- Invitation acceptance page
- Staff creation with permissions
- Navigation filtering by permissions
- **Invitation email API route using Resend** ✨

✅ **Invitation System:**
- API route: `app/api/staff/invite/route.ts`
- Uses existing Resend setup (same as quotes/invoices)
- Sends branded HTML invitation emails
- Updates `invited_at` timestamp in staff table
- Includes signup link with pre-filled email

## How It Works

### Creating a New Staff Member:

1. Admin fills out staff member form (name, email, permissions)
2. Clicks "Send Invitation"
3. System creates staff record in database with `is_active=false`
4. API route sends invitation email via Resend
5. Staff member receives email with "Accept Invitation" button
6. They click link → redirected to signup page
7. They create password → account activated (`is_active=true`)
8. They can now log in with filtered navigation based on permissions

### Resending Invitations:

1. Admin views staff list, sees "Pending" status badge
2. Clicks "Resend Invite" button
3. API sends new invitation email
4. Updates `invited_at` timestamp

No manual server-side work needed - it's all automated! 🎉

## Testing Checklist

- [ ] Run database migration in Supabase SQL Editor
- [ ] Verify `permissions` column added with default values
- [ ] Test `has_staff_permission()` function works
- [ ] **Create new staff member → Check invitation email received**
- [ ] **Click invitation link → Verify redirects to signup page**
- [ ] **Create password and login → Check account activated**
- [ ] Update existing staff permissions (checks save)
- [ ] View staff list (checks status badges: Pending/Active)
- [ ] **Resend invitation → Verify new email sent**
- [ ] Login as staff member (checks filtered navigation)
- [ ] Access protected page without permission (checks guard blocks)
- [ ] Access protected page with permission (checks guard allows)
- [ ] Login as Owner (checks sees all navigation)

### Complete End-to-End Test:

1. **As Business Owner:**
   - Go to Settings → Staff Members
   - Click "New Staff Member"
   - Fill in: Name, Email, Mobile, Role
   - Set permissions (toggle switches)
   - Click "Send Invitation"
   - ✅ Should see success message
   - ✅ Staff should appear in list with "Pending" badge

2. **Check Email (as invited staff):**
   - ✅ Invitation email arrives
   - ✅ Email is branded with orange TradeQuote colors
   - ✅ Contains "Accept Invitation" button

3. **Accept Invitation:**
   - Click button in email
   - ✅ Redirects to signup page with email pre-filled
   - Enter password (min 8 characters)
   - Confirm password
   - Click "Create Account"
   - ✅ Redirects to dashboard

4. **As New Staff Member:**
   - ✅ See only navigation items you have permission for
   - Try accessing restricted page (e.g., Invoices without permission)
   - ✅ Should see "Access Denied" message
   - Try accessing allowed page (e.g., Jobs with permission)
   - ✅ Should see the page content

5. **Back as Owner:**
   - Refresh staff list
   - ✅ Staff status changed from "Pending" to "Active"
   - ✅ "Resend Invite" button no longer shows

## Database Migration SQL

To apply the migration, run this in Supabase SQL Editor:

```sql
-- File: db/migrations/20260326_staff_permissions_and_invitation.sql
-- Copy and paste the entire contents of this file
```

## Permission Defaults

**New Staff Members (DEFAULT_PERMISSIONS):**
- ✅ Timesheets
- ✅ Jobs
- ✅ Scheduling & Dispatch
- ✅ Enquiries
- ❌ Invoicing
- ❌ Quoting
- ❌ Purchases
- ❌ Reports & Financials
- ❌ Staff Tracking
- ❌ Settings
- ❌ Staff Members
- ❌ Plan & Billing

**Account Owners (OWNER_PERMISSIONS):**
- ✅ All 12 permissions enabled

## Security Notes

1. **Owner Role Bypass:** Account Owners automatically bypass all permission checks
2. **JSONB Storage:** Permissions stored as JSONB for flexibility and indexing
3. **GIN Index:** Created on permissions column for fast queries
4. **RLS Policies:** Ensure staff can only see their own business data
5. **Service Role Key:** Required for Admin API operations, keep server-side only

## Architecture Decisions

**Why JSONB instead of separate table?**
- Simpler queries (no JOINs required)
- Faster reads with GIN index
- Easier to add new permissions
- Atomic updates

**Why filter navigation client-side?**
- Instant UI updates
- Better user experience
- Permissions already loaded in layout
- No API calls per navigation

**Why both client and server checks?**
- Client: UI/UX (hide unavailable options)
- Server: Security (enforce access control)
- Defense in depth approach

## Support

For questions or issues:
1. Check Supabase logs for database errors
2. Check browser console for client-side errors
3. Verify environment variables are set
4. Confirm database migration was applied
5. Test with Owner account first (bypasses restrictions)
