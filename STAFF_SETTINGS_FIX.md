# Staff Settings Fix

## Issues Fixed

### 1. Account Owner Not Appearing
**Problem**: Account owner was not being created or shown in staff list

**Root Cause**: Missing `owner_id` field (NOT NULL constraint) when creating Account Owner

**Fix**: 
- Added `owner_id: user.id` to Account Owner auto-creation
- Added `user_id: user.id` to link to current user's profile
- Added debug logging to track creation process

### 2. Staff Creation Failing with Empty Error
**Problem**: Creating new staff returned empty error object `{}`

**Root Cause**: Missing required `owner_id` field (NOT NULL constraint)

**Fix**:
- Added `owner_id: user.id` to new staff insert
- Added comprehensive debug logging showing:
  - Full error details (message, code, details, hint)
  - Data being inserted
  - Current user ID and business ID

### 3. Permission Toggles Not Showing
**Status**: Toggles ARE implemented in code (lines 783-811)

**Possible Causes**:
- Modal not opening due to previous error
- RLS policy blocking staff fetch
- Missing permissions in user_businesses table

**What to Check**:
- Open browser console and look for errors
- Check if "New Staff Member" button opens modal
- Verify all permission checkboxes are visible in modal

## Database Schema

### Staff Table Required Fields:
- `owner_id` UUID NOT NULL - The business owner (references profiles.id)
- `business_id` UUID - The business (for multi-tenancy)
- `user_id` UUID (nullable) - Links to staff member's profile (null until they sign up)

### Staff Architecture:
- **profiles** table: Identity (full_name, email) - one per user
- **staff** table: Work relationship (permissions, role, billing_rate)
- When creating staff without user account: `user_id` is NULL initially
- `owner_id` always points to the business owner (current logged-in user)

## RLS Policy Check

The staff table has this RLS policy:
```sql
CREATE POLICY staff_access ON staff
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_staff_members = true
    )
  );
```

**Requirements**:
1. User must have `can_access_staff_members = true` in user_businesses
2. User must be `is_active = true`
3. Business IDs must match

## Testing Steps

### 1. Check Console Logs
- Open Staff Settings page
- Open browser console (F12)
- Look for logs:
  - "Creating Account Owner with data:"
  - "Account Owner created successfully"
  - Any error messages

### 2. Test Account Owner Visibility
- Navigate to Settings > Staff Settings
- Account Owner should appear in the list
- If not, check console for "Error creating Account Owner"

### 3. Test New Staff Creation
- Click "New Staff Member" button
- Modal should open with form
- Verify all permission checkboxes are visible
- Fill in Name and Email (required)
- Click Save
- Check console for:
  - "Creating new staff with data:"
  - "Staff created successfully:" OR detailed error

### 4. If Still Failing, Check Permissions
Run this query in Supabase SQL Editor:
```sql
SELECT 
  ub.business_id,
  ub.can_access_staff_members,
  ub.is_active,
  b.name as business_name
FROM user_businesses ub
JOIN businesses b ON b.id = ub.business_id
WHERE ub.user_id = auth.uid();
```

Verify:
- `can_access_staff_members` is `true`
- `is_active` is `true`

## Changes Made

**File**: `app/dashboard/settings/sections/StaffPermissionsSettings.tsx`

**Line ~110-150**: Updated Account Owner auto-creation
- Added `owner_id: user.id`
- Added `user_id: user.id`
- Added debug logging

**Line ~200-220**: Updated new staff creation
- Added `owner_id: user.id` to newStaffData object
- Added comprehensive error logging
- Added `.select()` to see inserted data

## Expected Behavior After Fix

1. **On first visit**: Account Owner is auto-created and appears in list
2. **Creating new staff**: Form submits successfully, new staff appears in list
3. **Error messages**: If something fails, detailed error info appears in console

## If Still Failing

Check these in order:
1. Console logs - look for specific error messages
2. RLS permissions - verify can_access_staff_members = true
3. Business ID - make sure user has a business record
4. Table schema - verify owner_id column exists and is nullable/not nullable correctly
