-- =====================================================
-- SCHEDULE EVENTS AND M&Q TIMESHEET SUPPORT
-- Extends scheduling and timesheet system for M&Q appointments
-- =====================================================

-- =====================================================
-- 1. CREATE SCHEDULE_EVENTS TABLE
-- Replaces jobs.scheduled_date approach with proper scheduling
-- =====================================================

CREATE TABLE IF NOT EXISTS schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (
    event_type IN ('measure_quote', 'scheduled_work', 'admin')
  ),
  title text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  duration_minutes integer,
  staff_id uuid REFERENCES staff(id),
  job_id uuid REFERENCES jobs(id),
  enquiry_id uuid REFERENCES enquiries(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  
  -- ensure non-admin events have at least one anchor
  CONSTRAINT schedule_anchor_check CHECK (
    event_type = 'admin'
    OR job_id IS NOT NULL
    OR enquiry_id IS NOT NULL
  )
);

-- RLS policies for schedule_events
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedule_events" ON schedule_events
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 2. EXTEND ACTIVE_SHIFTS FOR M&Q SUPPORT
-- =====================================================

ALTER TABLE active_shifts
  ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES enquiries(id),
  ADD COLUMN IF NOT EXISTS event_type text CHECK (
    event_type IN ('job', 'measure_quote', 'general')
  ) DEFAULT 'job';

-- =====================================================
-- 3. EXTEND TIMESHEET_ENTRIES FOR M&Q SUPPORT
-- =====================================================

ALTER TABLE timesheet_entries
  ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES enquiries(id),
  ADD COLUMN IF NOT EXISTS event_type text CHECK (
    event_type IN ('job', 'measure_quote', 'general')
  ) DEFAULT 'job';

-- =====================================================
-- MIGRATION DATA: EXISTING JOBS WITH SCHEDULED_DATE
-- Migrate existing scheduled jobs to the new schedule_events table
-- =====================================================

INSERT INTO schedule_events (
  user_id,
  event_type,
  title,
  scheduled_date,
  job_id,
  created_at
)
SELECT 
  j.user_id,
  'scheduled_work'::text as event_type,
  j.title,
  j.scheduled_date,
  j.id as job_id,
  j.created_at
FROM jobs j 
WHERE j.scheduled_date IS NOT NULL;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get schedule event display title
CREATE OR REPLACE FUNCTION get_schedule_event_title(
  event_type text,
  title text DEFAULT NULL,
  job_title text DEFAULT NULL,
  enquiry_client_name text DEFAULT NULL
) RETURNS text AS $$
BEGIN
  CASE event_type
    WHEN 'measure_quote' THEN
      RETURN COALESCE('M&Q - ' || enquiry_client_name, 'M&Q - Unknown Client');
    WHEN 'scheduled_work' THEN
      RETURN COALESCE(job_title, 'Scheduled Work');
    WHEN 'admin' THEN
      RETURN COALESCE(title, 'Admin Task');
    ELSE
      RETURN 'Unknown Event';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get timesheet entry display label
CREATE OR REPLACE FUNCTION get_timesheet_entry_label(
  event_type text,
  job_title text DEFAULT NULL,
  enquiry_client_name text DEFAULT NULL
) RETURNS text AS $$
BEGIN
  CASE event_type
    WHEN 'job' THEN
      RETURN COALESCE(job_title, 'Unknown Job');
    WHEN 'measure_quote' THEN
      RETURN COALESCE('M&Q - ' || enquiry_client_name, 'M&Q - Unknown Client');
    WHEN 'general' THEN
      RETURN 'General Work';
    ELSE
      RETURN 'Unknown Work';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_user_date ON schedule_events(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_job_id ON schedule_events(job_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_enquiry_id ON schedule_events(enquiry_id);

CREATE INDEX IF NOT EXISTS idx_active_shifts_enquiry_id ON active_shifts(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_enquiry_id ON timesheet_entries(enquiry_id);