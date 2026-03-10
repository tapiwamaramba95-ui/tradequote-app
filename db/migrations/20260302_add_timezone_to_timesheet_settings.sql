-- =====================================================
-- ADD TIMEZONE TO TIMESHEET SETTINGS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add timezone column to timesheet_settings table
ALTER TABLE timesheet_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Australia/Sydney';

-- Set timezone for existing users (if any)
UPDATE timesheet_settings 
SET timezone = 'Australia/Sydney' 
WHERE timezone IS NULL;

-- Verification
SELECT 'Timezone column added successfully!' as message;

-- Check the updated table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'timesheet_settings' 
AND column_name = 'timezone';