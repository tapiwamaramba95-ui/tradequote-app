-- Migration: Link staff table to profiles table
-- This establishes the proper relationship between user identity (profiles) and work roles (staff)

DO $$ 
BEGIN

-- Add user_id column that links to profiles
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff' AND column_name = 'user_id'
) THEN
  ALTER TABLE staff ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  
  -- Create index for fast lookups
  CREATE INDEX idx_staff_user_id ON staff(user_id);
  
  -- Add comment explaining the relationship
  COMMENT ON COLUMN staff.user_id IS 'Links to profiles table. Use profiles.full_name and profiles.email for display. Staff table is for work-specific data only.';
END IF;

-- Add owner_id to track which business this staff member belongs to
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff' AND column_name = 'owner_id'
) THEN
  ALTER TABLE staff ADD COLUMN owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;
  
  -- Create index for filtering staff by business owner
  CREATE INDEX idx_staff_owner_id ON staff(owner_id);
  
  COMMENT ON COLUMN staff.owner_id IS 'The business owner who this staff member works for. Enables multi-tenant staff management.';
END IF;

-- Make name and email nullable since they should come from profiles
-- Keep them for backward compatibility but encourage using profiles.full_name
ALTER TABLE staff ALTER COLUMN name DROP NOT NULL;
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN staff.name IS 'DEPRECATED: Use profiles.full_name via user_id instead. Kept for backward compatibility.';
COMMENT ON COLUMN staff.email IS 'DEPRECATED: Use profiles.email via user_id instead. Kept for backward compatibility.';

-- Add unique constraint: same user can't be added as staff twice for same owner
-- (but they could work for multiple owners)
IF NOT EXISTS (
  SELECT 1 FROM pg_constraint 
  WHERE conname = 'unique_staff_user_per_owner'
) THEN
  ALTER TABLE staff ADD CONSTRAINT unique_staff_user_per_owner UNIQUE(user_id, owner_id);
END IF;

-- Add is_active flag if it doesn't exist (better than status for simple active/inactive)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff' AND column_name = 'is_active'
) THEN
  ALTER TABLE staff ADD COLUMN is_active BOOLEAN DEFAULT true;
  
  -- Migrate existing status to is_active
  UPDATE staff SET is_active = (status = 'active');
  
  COMMENT ON COLUMN staff.is_active IS 'Whether this staff member is currently active. Use this instead of status field.';
END IF;

-- Add updated_at timestamp
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff' AND column_name = 'updated_at'
) THEN
  ALTER TABLE staff ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
END IF;

END $$;

-- Create trigger function (outside DO block)
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'staff_updated_at_trigger'
  ) THEN
    CREATE TRIGGER staff_updated_at_trigger
      BEFORE UPDATE ON staff
      FOR EACH ROW
      EXECUTE FUNCTION update_staff_updated_at();
  END IF;
END $$;

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS staff_owner_access ON staff;
DROP POLICY IF EXISTS staff_self_access ON staff;

-- Policy: Business owners can see their staff
CREATE POLICY staff_owner_access ON staff
  FOR ALL
  USING (owner_id = auth.uid());

-- Policy: Staff members can see their own record
CREATE POLICY staff_self_access ON staff
  FOR SELECT
  USING (user_id = auth.uid());

-- Table comment explaining the design
COMMENT ON TABLE staff IS 
'Staff members and their work-specific data. Links to profiles table via user_id. 
Use profiles.full_name and profiles.email for identity data.
This table is for work relationships (role, permissions, rates) only.

Recommended query pattern:
SELECT s.*, p.full_name, p.email 
FROM staff s 
JOIN profiles p ON s.user_id = p.id 
WHERE s.owner_id = current_user_id';

/*
USAGE EXAMPLES:

-- Get all staff with their user details
SELECT 
  s.id,
  s.role,
  s.hourly_cost,
  s.billing_rate,
  s.is_active,
  p.full_name,
  p.email
FROM staff s
JOIN profiles p ON s.user_id = p.id
WHERE s.owner_id = auth.uid()
AND s.is_active = true;

-- Add a new staff member (they must have a profile first)
INSERT INTO staff (user_id, owner_id, role, hourly_cost, billing_rate)
VALUES (
  'user-profile-uuid',
  auth.uid(),
  'Tradesperson',
  85.00,
  '110.00'
);

-- Check if user is staff for current business
SELECT EXISTS (
  SELECT 1 FROM staff 
  WHERE user_id = auth.uid() 
  AND owner_id = 'business-owner-uuid'
  AND is_active = true
);

-- Invite flow sequence:
1. Create auth.users account (Supabase Auth)
2. Trigger creates profiles record automatically
3. Business owner creates staff record linking profiles.id
4. Staff member can now log in and access the business
*/
