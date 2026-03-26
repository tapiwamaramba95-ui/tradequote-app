-- =====================================================
-- STAFF PERMISSIONS & INVITATION SYSTEM
-- Date: March 26, 2026
-- Purpose: Add permissions management and invitation workflow to staff system
-- =====================================================

-- Step 1: Add permissions column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "timesheets": true,
  "jobs": true,
  "invoicing": false,
  "quoting": false,
  "purchases": false,
  "reports_financials": false,
  "scheduling_dispatch": true,
  "enquiries": true,
  "staff_tracking": false,
  "settings": false,
  "staff_members": false,
  "plan_billing": false
}'::jsonb;

-- Step 2: Add invitation tracking columns
ALTER TABLE staff ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Step 3: Add index for faster permission queries
CREATE INDEX IF NOT EXISTS idx_staff_permissions ON staff USING GIN (permissions);

-- Step 4: Set default permissions for existing staff members
UPDATE staff 
SET permissions = '{
  "timesheets": true,
  "jobs": true,
  "invoicing": true,
  "quoting": true,
  "purchases": true,
  "reports_financials": true,
  "scheduling_dispatch": true,
  "enquiries": true,
  "staff_tracking": true,
  "settings": true,
  "staff_members": true,
  "plan_billing": true
}'::jsonb
WHERE permissions IS NULL AND role = 'Owner';

-- Set limited permissions for non-owner existing staff
UPDATE staff 
SET permissions = '{
  "timesheets": true,
  "jobs": true,
  "invoicing": false,
  "quoting": false,
  "purchases": false,
  "reports_financials": false,
  "scheduling_dispatch": true,
  "enquiries": true,
  "staff_tracking": false,
  "settings": false,
  "staff_members": false,
  "plan_billing": false
}'::jsonb
WHERE permissions IS NULL AND (role IS NULL OR role != 'Owner');

-- Step 5: Add comments for documentation
COMMENT ON COLUMN staff.permissions IS 'JSONB object containing permission flags for staff member access control. Keys: timesheets, jobs, invoicing, quoting, purchases, reports_financials, scheduling_dispatch, enquiries, staff_tracking, settings, staff_members, plan_billing';

COMMENT ON COLUMN staff.invited_at IS 'Timestamp when invitation email was sent to this staff member';

COMMENT ON COLUMN staff.accepted_at IS 'Timestamp when staff member accepted invitation and created their account';

-- Step 6: Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_staff_permission(
  p_user_id UUID,
  p_business_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  staff_permissions JSONB;
BEGIN
  -- Get staff permissions
  SELECT permissions INTO staff_permissions
  FROM staff
  WHERE user_id = p_user_id 
    AND business_id = p_business_id
    AND is_active = true
  LIMIT 1;
  
  -- If no staff record, return false
  IF staff_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if permission is enabled
  RETURN COALESCE((staff_permissions->p_permission_key)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION has_staff_permission IS 'Check if a user has a specific permission in a business context';
