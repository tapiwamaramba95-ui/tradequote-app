-- =====================================================
-- TIMESHEETS SYSTEM COMPLETE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- TIMESHEET ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  staff_member_id UUID REFERENCES profiles(id), -- Which staff member (for multi-staff accounts)
  
  -- Entry Details
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2), -- Calculated: (end_time - start_time - break) in hours
  
  -- Job Link
  job_id UUID REFERENCES jobs(id),
  
  -- Entry Type
  entry_type TEXT DEFAULT 'clock', -- 'clock' (from clock in/out) or 'manual' (added manually)
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- Notes
  notes TEXT,
  
  -- Approval
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ACTIVE SHIFTS TABLE (for clock in/out tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS active_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  staff_member_id UUID REFERENCES profiles(id),
  
  job_id UUID REFERENCES jobs(id),
  
  clock_in_time TIMESTAMP NOT NULL,
  clock_out_time TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TIMESHEET SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- View Preferences
  default_view TEXT DEFAULT 'week', -- 'day', 'week', 'month'
  week_start_day INTEGER DEFAULT 1, -- 1 = Monday, 0 = Sunday
  
  -- Work Hours
  standard_start_time TIME DEFAULT '07:00',
  standard_end_time TIME DEFAULT '17:00',
  
  -- Break Settings
  auto_deduct_breaks BOOLEAN DEFAULT false,
  default_break_minutes INTEGER DEFAULT 30,
  
  -- Overtime Settings
  overtime_trigger_hours DECIMAL(4,2) DEFAULT 8.0, -- Overtime after X hours per day
  overtime_trigger_weekly_hours DECIMAL(4,2) DEFAULT 40.0, -- OR after X hours per week
  overtime_rate DECIMAL(3,2) DEFAULT 1.5, -- 1.5x or 2.0x
  
  -- Approval & Control
  require_manager_approval BOOLEAN DEFAULT true,
  allow_manual_entry BOOLEAN DEFAULT true,
  require_manual_entry_reason BOOLEAN DEFAULT false,
  
  -- Rounding
  rounding_interval INTEGER DEFAULT 1, -- Minutes: 1, 6, 15
  rounding_method TEXT DEFAULT 'nearest', -- 'nearest', 'up', 'down'
  
  -- Notifications
  remind_clock_in BOOLEAN DEFAULT false,
  remind_clock_out BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '18:00',
  
  -- Timezone
  timezone TEXT DEFAULT 'Australia/Sydney', -- User's timezone
  
  -- Export
  export_format TEXT DEFAULT 'csv', -- 'csv', 'excel', 'pdf'
  include_notes_in_export BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS timesheet_entries_user_id_idx ON timesheet_entries(user_id);
CREATE INDEX IF NOT EXISTS timesheet_entries_staff_id_idx ON timesheet_entries(staff_member_id);
CREATE INDEX IF NOT EXISTS timesheet_entries_date_idx ON timesheet_entries(date);
CREATE INDEX IF NOT EXISTS timesheet_entries_job_id_idx ON timesheet_entries(job_id);
CREATE INDEX IF NOT EXISTS timesheet_entries_status_idx ON timesheet_entries(status);

CREATE INDEX IF NOT EXISTS active_shifts_user_id_idx ON active_shifts(user_id);
CREATE INDEX IF NOT EXISTS active_shifts_staff_id_idx ON active_shifts(staff_member_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timesheet_entries" ON timesheet_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own active_shifts" ON active_shifts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own timesheet_settings" ON timesheet_settings FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate total hours
CREATE OR REPLACE FUNCTION calculate_timesheet_hours(
  p_start_time TIME,
  p_end_time TIME,
  p_break_minutes INTEGER
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  -- Calculate minutes between times
  total_minutes := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60;
  
  -- Subtract break
  total_minutes := total_minutes - COALESCE(p_break_minutes, 0);
  
  -- Convert to hours (2 decimal places)
  RETURN ROUND((total_minutes::DECIMAL / 60), 2);
END;
$$ LANGUAGE plpgsql;

-- Auto-create default settings
CREATE OR REPLACE FUNCTION create_default_timesheet_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timesheet_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_timesheet_settings_trigger ON profiles;
CREATE TRIGGER create_timesheet_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_timesheet_settings();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
SELECT 'Timesheets system created successfully!' as message;