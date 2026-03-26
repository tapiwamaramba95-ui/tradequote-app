-- =====================================================
-- GOOGLE CALENDAR INTEGRATION
-- =====================================================
-- Created: 2026-03-27
-- Purpose: Store Google Calendar OAuth tokens for calendar sync

-- Add column to profiles table for Google Calendar tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_tokens JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar_tokens 
ON profiles(google_calendar_tokens) 
WHERE google_calendar_tokens IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.google_calendar_tokens IS 
'Stores Google Calendar OAuth tokens including access_token, refresh_token, expiry_date, scope, and token_type';

-- Example token structure:
-- {
--   "access_token": "ya29.a0AfB_byAbc123...",
--   "refresh_token": "1//0gAbc123...",
--   "expiry_date": 1711445678000,
--   "scope": "https://www.googleapis.com/auth/calendar",
--   "token_type": "Bearer",
--   "connected_at": "2024-03-26T10:30:00Z"
-- }
