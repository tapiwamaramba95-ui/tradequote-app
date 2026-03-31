-- Fix timesheets.staff_id foreign key to reference staff table instead of users table
-- Migration: 20260331_fix_timesheets_staff_id_constraint.sql

BEGIN;

-- Drop the incorrect foreign key constraint
ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_staff_id_fkey;

-- Add the correct foreign key constraint to staff table
ALTER TABLE timesheets
ADD CONSTRAINT timesheets_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Update any existing records that have user_id in staff_id field
-- This will fix records that were created with the wrong ID
UPDATE timesheets t
SET staff_id = s.id
FROM staff s
WHERE t.user_id = s.user_id
  AND (t.staff_id IS NULL OR t.staff_id = t.user_id);

COMMIT;

-- Verify the constraint
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'timesheets' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'staff_id';
