-- Migration: New Job Features
-- Created: 2026-03-13
-- Purpose: Add custom fields, job staff, site contacts for enhanced job creation

-- Custom field definitions (per user/company)
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'checkbox'
  field_options JSONB, -- For select dropdowns: ["Option 1", "Option 2"]
  applies_to VARCHAR(50) NOT NULL DEFAULT 'jobs', -- 'jobs', 'clients', 'quotes', etc.
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, field_name, applies_to)
);

-- Custom field values (per job)
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  field_definition_id UUID REFERENCES custom_field_definitions(id) ON DELETE CASCADE NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(job_id, field_definition_id)
);

-- Job staff assignments
CREATE TABLE job_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50), -- 'lead', 'assistant', 'supervisor'
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Site contacts (people at the job location)
CREATE TABLE site_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(100), -- 'Property Manager', 'Tenant', 'Building Supervisor'
  phone VARCHAR(50),
  email VARCHAR(255),
  notes TEXT,
  is_primary BOOLEAN DEFAULT false, -- Primary contact
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_custom_field_definitions_user ON custom_field_definitions(user_id, applies_to, is_active);
CREATE INDEX idx_custom_field_values_job ON custom_field_values(job_id);
CREATE INDEX idx_job_staff_job ON job_staff(job_id);
CREATE INDEX idx_job_staff_user ON job_staff(user_id);
CREATE INDEX idx_site_contacts_job ON site_contacts(job_id);

-- RLS Policies
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_contacts ENABLE ROW LEVEL SECURITY;

-- Custom field definitions policies
CREATE POLICY custom_field_definitions_select ON custom_field_definitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY custom_field_definitions_insert ON custom_field_definitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_field_definitions_update ON custom_field_definitions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY custom_field_definitions_delete ON custom_field_definitions
  FOR DELETE USING (auth.uid() = user_id);

-- Custom field values policies  
CREATE POLICY custom_field_values_select ON custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = custom_field_values.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY custom_field_values_insert ON custom_field_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = custom_field_values.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY custom_field_values_update ON custom_field_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = custom_field_values.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY custom_field_values_delete ON custom_field_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = custom_field_values.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Job staff policies
CREATE POLICY job_staff_select ON job_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_staff.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY job_staff_insert ON job_staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_staff.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY job_staff_update ON job_staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_staff.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY job_staff_delete ON job_staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_staff.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Site contacts policies
CREATE POLICY site_contacts_select ON site_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = site_contacts.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY site_contacts_insert ON site_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = site_contacts.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY site_contacts_update ON site_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = site_contacts.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY site_contacts_delete ON site_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = site_contacts.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Add internal_notes column to jobs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'internal_notes'
  ) THEN
    ALTER TABLE jobs ADD COLUMN internal_notes TEXT;
  END IF;
END $$;

-- Seed some common custom field definitions
INSERT INTO custom_field_definitions (user_id, field_name, field_type, applies_to, display_order) VALUES 
  ((SELECT id FROM auth.users LIMIT 1), 'Pool Type', 'select', 'jobs', 1),
  ((SELECT id FROM auth.users LIMIT 1), 'Gate Access Code', 'text', 'jobs', 2),
  ((SELECT id FROM auth.users LIMIT 1), 'Alarm Code', 'text', 'jobs', 3),
  ((SELECT id FROM auth.users LIMIT 1), 'Special Instructions', 'text', 'jobs', 4),
  ((SELECT id FROM auth.users LIMIT 1), 'Preferred Time', 'select', 'jobs', 5),
  ((SELECT id FROM auth.users LIMIT 1), 'Equipment Required', 'checkbox', 'jobs', 6)
ON CONFLICT (user_id, field_name, applies_to) DO NOTHING;

-- Set options for select fields
UPDATE custom_field_definitions 
SET field_options = '["Swimming Pool", "Spa/Hot Tub", "Water Feature", "Pond"]'::jsonb
WHERE field_name = 'Pool Type';

UPDATE custom_field_definitions 
SET field_options = '["Morning (8-12)", "Afternoon (12-5)", "Evening (5-8)", "Flexible"]'::jsonb
WHERE field_name = 'Preferred Time';