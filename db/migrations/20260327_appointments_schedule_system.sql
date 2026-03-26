-- =============================================
-- APPOINTMENTS/SCHEDULE SYSTEM - EXTEND FOR CONNECTIONS
-- =============================================
-- This migration extends the existing appointments table to support
-- subcontractor connections alongside staff assignments

-- Add connection assignment column if it doesn't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS assigned_connection_id UUID REFERENCES connections(id) ON DELETE SET NULL;

-- Add connection status columns if they don't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) CHECK (connection_status IN ('pending', 'accepted', 'declined')),
ADD COLUMN IF NOT EXISTS connection_responded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS connection_notes TEXT;

-- Ensure other required columns exist (these might already be there)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS business_id UUID,
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS street_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS suburb VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Note: Computed address field removed due to PostgreSQL immutability requirements
-- Address formatting can be done in application code instead

-- Update constraints if needed
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_assignment' AND conrelid = 'appointments'::regclass
  ) THEN
    ALTER TABLE appointments DROP CONSTRAINT check_assignment;
  END IF;
  
  -- Add new constraint (optional - allows unassigned appointments or connection assignments)
  ALTER TABLE appointments ADD CONSTRAINT check_assignment CHECK (
    (assigned_staff_id IS NOT NULL AND assigned_connection_id IS NULL) OR
    (assigned_staff_id IS NULL AND assigned_connection_id IS NOT NULL) OR
    (assigned_staff_id IS NULL AND assigned_connection_id IS NULL)
  );
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_job ON appointments(job_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_connection ON appointments(assigned_connection_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_date ON appointments(start_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_connection_status ON appointments(connection_status) WHERE connection_status IS NOT NULL;

-- Add comments
COMMENT ON TABLE appointments IS 'Schedules and appointments for staff and subcontractor connections';
COMMENT ON COLUMN appointments.assigned_staff_id IS 'If assigned to internal staff (references staff table)';
COMMENT ON COLUMN appointments.assigned_connection_id IS 'If assigned to external subcontractor connection';
COMMENT ON COLUMN appointments.connection_status IS 'For connections only: pending/accepted/declined';
COMMENT ON COLUMN appointments.status IS 'Overall appointment status for tracking';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can view appointments for their business
DROP POLICY IF EXISTS "Users can view business appointments" ON appointments;
CREATE POLICY "Users can view business appointments"
  ON appointments FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Connections can view appointments assigned to them
DROP POLICY IF EXISTS "Connections can view their appointments" ON appointments;
CREATE POLICY "Connections can view their appointments"
  ON appointments FOR SELECT
  USING (
    assigned_connection_id IN (
      SELECT id FROM connections WHERE connected_user_id = auth.uid()
    )
  );

-- Staff can view appointments assigned to them
DROP POLICY IF EXISTS "Staff can view their appointments" ON appointments;
CREATE POLICY "Staff can view their appointments"
  ON appointments FOR SELECT
  USING (
    assigned_staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Users can create appointments for their business
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Users can update appointments for their business
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;
CREATE POLICY "Users can update appointments"
  ON appointments FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Connections can update their appointment status
DROP POLICY IF EXISTS "Connections can update their status" ON appointments;
CREATE POLICY "Connections can update their status"
  ON appointments FOR UPDATE
  USING (
    assigned_connection_id IN (
      SELECT id FROM connections WHERE connected_user_id = auth.uid()
    )
  );

-- Users can delete appointments for their business
DROP POLICY IF EXISTS "Users can delete appointments" ON appointments;
CREATE POLICY "Users can delete appointments"
  ON appointments FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );
