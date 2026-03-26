-- =====================================================
-- ADD GOOGLE CALENDAR EVENT ID TO JOBS
-- =====================================================
-- Created: 2026-03-27
-- Purpose: Track Google Calendar event IDs for job sync

-- Add column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_google_calendar_event 
ON jobs(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN jobs.google_calendar_event_id IS 
'Google Calendar event ID for synced jobs. Used to update/delete events when job changes.';
