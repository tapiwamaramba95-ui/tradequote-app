-- Migration: Grandfather Existing Users
-- Date: 2026-03-27
-- Purpose: Set existing trial users (without trial_started_at) to active status
--          New users will get proper trial tracking from signup onwards

-- Update existing users who are on trial but don't have trial dates set
-- These are users who signed up before the trial system was implemented
UPDATE profiles 
SET subscription_status = 'active'
WHERE subscription_status = 'trial' 
  AND trial_started_at IS NULL;

-- Log the change
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Grandfathered % existing users to active status', updated_count;
END $$;
