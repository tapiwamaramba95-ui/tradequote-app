-- =====================================================
-- JOBS AS CENTRAL HUB - COMPLETE SYSTEM RESTRUCTURE
-- =====================================================
-- Created: 2026-03-06
-- Purpose: Make Jobs the central hub - everything flows through Jobs

-- =====================================================
-- UPDATE JOBS TABLE (NOW THE CENTRAL HUB)
-- =====================================================
ALTER TABLE jobs
  -- Enquiry info (jobs now start at "enquiry" status)
  ADD COLUMN IF NOT EXISTS enquiry_source TEXT, -- 'phone', 'email', 'website', 'referral', 'walk-in', 'social_media'
  ADD COLUMN IF NOT EXISTS enquiry_date TIMESTAMP DEFAULT NOW(),
  
  -- Financial tracking (aggregated from everything)
  ADD COLUMN IF NOT EXISTS quoted_amount DECIMAL(10,2), -- From latest quote
  ADD COLUMN IF NOT EXISTS invoiced_amount DECIMAL(10,2), -- Sum of all invoices
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2), -- Sum of paid invoices
  
  -- Cost tracking (aggregated from timesheets, invoices, etc.)
  ADD COLUMN IF NOT EXISTS total_material_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labour_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_acquisition_cost DECIMAL(10,2) DEFAULT 0, -- M&Q time
  ADD COLUMN IF NOT EXISTS total_subcontractor_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_other_costs DECIMAL(10,2) DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin DECIMAL(5,2) DEFAULT 0;

-- Update default status
ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'enquiry';

-- Add description if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;

-- Add staff assignment
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS staff_member_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- Rename columns for consistency with TypeScript types
DO $$
BEGIN
  -- Rename title to job_name
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'title') THEN
    ALTER TABLE jobs RENAME COLUMN title TO job_name;
  END IF;
  
  -- Rename address to job_address  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'address') THEN
    ALTER TABLE jobs RENAME COLUMN address TO job_address;
  END IF;
END $$;

-- Update status check constraint to include 'enquiry'
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('enquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'));

-- =====================================================
-- UPDATE QUOTES TABLE (MUST LINK TO JOB)
-- =====================================================
-- Make job_id required (can't do if existing nulls, so conditional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM quotes WHERE job_id IS NULL
  ) THEN
    ALTER TABLE quotes ALTER COLUMN job_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS quote_version INTEGER DEFAULT 1, -- Multiple quotes per job
  ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT false;

-- =====================================================
-- UPDATE INVOICES TABLE (MUST LINK TO JOB)
-- =====================================================
-- Make job_id required (can't do if existing nulls, so conditional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM invoices WHERE job_id IS NULL
  ) THEN
    ALTER TABLE invoices ALTER COLUMN job_id SET NOT NULL;
  END IF;
END $$;

-- =====================================================
-- UPDATE TIMESHEET ENTRIES (SIMPLIFIED - JOB ONLY)
-- =====================================================
-- Remove old enquiry/quote/invoice links
ALTER TABLE timesheet_entries
  DROP COLUMN IF EXISTS enquiry_id,
  DROP COLUMN IF EXISTS quote_id,
  DROP COLUMN IF EXISTS invoice_id;

-- Make job_id required for non-general work
-- (general_admin can have null job_id, but job/measure_quote must have it)

-- Update event_type values to new naming convention
-- 'measure_quote' = M&Q time on job (CAC)
-- 'work' = Billable work on job (was 'job')
-- 'general_admin' = General overhead (was 'general', not job-specific, can have null job_id)

-- Drop old check constraints (if they exist)
ALTER TABLE timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_event_type_check;
ALTER TABLE active_shifts DROP CONSTRAINT IF EXISTS active_shifts_event_type_check;

-- Update timesheet_entries event_type values
UPDATE timesheet_entries SET event_type = 'work' WHERE event_type = 'job';
UPDATE timesheet_entries SET event_type = 'general_admin' WHERE event_type = 'general';

-- Update active_shifts event_type values
UPDATE active_shifts SET event_type = 'work' WHERE event_type = 'job';
UPDATE active_shifts SET event_type = 'general_admin' WHERE event_type = 'general';

-- Add new check constraints with updated values
ALTER TABLE timesheet_entries 
  ADD CONSTRAINT timesheet_entries_event_type_check 
  CHECK (event_type IN ('work', 'measure_quote', 'general_admin'));

ALTER TABLE active_shifts 
  ADD CONSTRAINT active_shifts_event_type_check 
  CHECK (event_type IN ('work', 'measure_quote', 'general_admin'));

-- =====================================================
-- JOB APPOINTMENTS (NEW TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  appointment_type TEXT NOT NULL, -- 'measure_quote', 'work', 'follow_up'
  
  scheduled_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  address TEXT, -- Can override job address
  notes TEXT,
  
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_enquiry_date_idx ON jobs(enquiry_date);
CREATE INDEX IF NOT EXISTS jobs_enquiry_source_idx ON jobs(enquiry_source);

CREATE INDEX IF NOT EXISTS quotes_job_id_version_idx ON quotes(job_id, quote_version);
CREATE INDEX IF NOT EXISTS quotes_is_accepted_idx ON quotes(is_accepted);

CREATE INDEX IF NOT EXISTS job_appointments_job_id_idx ON job_appointments(job_id);
CREATE INDEX IF NOT EXISTS job_appointments_date_idx ON job_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS job_appointments_user_id_idx ON job_appointments(user_id);

-- =====================================================
-- AUTO-INCREMENT JOB NUMBERS
-- =====================================================
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
  last_job_number TEXT;
BEGIN
  -- Only set if job_number is null
  IF NEW.job_number IS NULL THEN
    -- Get prefix from business_settings or use default
    SELECT COALESCE(job_prefix, 'J') INTO prefix
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- If no prefix found, use default
    IF prefix IS NULL THEN
      prefix := 'J';
    END IF;
    
    -- Get settings for start number
    SELECT COALESCE(job_start_number, 1) INTO next_number
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    IF next_number IS NULL THEN
      next_number := 1;
    END IF;
    
    -- Get the last job number with this prefix to determine next number
    SELECT job_number INTO last_job_number
    FROM jobs
    WHERE user_id = NEW.user_id
      AND job_number ~ ('^' || prefix || '\d+$')
    ORDER BY job_number DESC
    LIMIT 1;
    
    -- If we found a previous job, extract the number and increment
    IF last_job_number IS NOT NULL THEN
      next_number := SUBSTRING(last_job_number FROM (length(prefix) + 1))::INTEGER + 1;
    END IF;
    
    -- Set the job number with 5-digit padding (matches invoice format)
    NEW.job_number := prefix || LPAD(next_number::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_number_trigger ON jobs;
CREATE TRIGGER set_job_number_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_number();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE job_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own job_appointments" ON job_appointments;
CREATE POLICY "Users manage own job_appointments" ON job_appointments
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- AUTO-INCREMENT QUOTE VERSIONS
-- =====================================================
CREATE OR REPLACE FUNCTION set_quote_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the next version number for this job
  IF NEW.quote_version IS NULL OR NEW.quote_version = 1 THEN
    SELECT COALESCE(MAX(quote_version), 0) + 1 INTO NEW.quote_version
    FROM quotes
    WHERE job_id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quote_version_trigger ON quotes;
CREATE TRIGGER set_quote_version_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_version();

-- =====================================================
-- AUTO-CALCULATE JOB COSTS (FROM EVERYTHING)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_job_totals(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_material_cost DECIMAL(10,2);
  v_labour_cost DECIMAL(10,2);
  v_acquisition_cost DECIMAL(10,2);
  v_subcontractor_cost DECIMAL(10,2);
  v_quoted_amount DECIMAL(10,2);
  v_invoiced_amount DECIMAL(10,2);
  v_paid_amount DECIMAL(10,2);
BEGIN
  -- 1. Material cost (from all invoices for this job)
  SELECT COALESCE(SUM(material_cost), 0) INTO v_material_cost
  FROM invoices
  WHERE job_id = p_job_id;
  
  -- 2. Labour cost (from timesheets - event_type = 'work')
  SELECT COALESCE(SUM(total_cost), 0) INTO v_labour_cost
  FROM timesheet_entries
  WHERE job_id = p_job_id
    AND event_type = 'work';
  
  -- 3. Acquisition cost (from timesheets - event_type = 'measure_quote')
  SELECT COALESCE(SUM(total_cost), 0) INTO v_acquisition_cost
  FROM timesheet_entries
  WHERE job_id = p_job_id
    AND event_type = 'measure_quote';
  
  -- 4. Subcontractor cost (from invoices)
  SELECT COALESCE(SUM(subcontractor_cost), 0) INTO v_subcontractor_cost
  FROM invoices
  WHERE job_id = p_job_id;
  
  -- 5. Quoted amount (from accepted or latest quote)
  SELECT total INTO v_quoted_amount
  FROM quotes
  WHERE job_id = p_job_id
    AND (is_accepted = true OR quote_version = (
      SELECT MAX(quote_version) FROM quotes WHERE job_id = p_job_id
    ))
  ORDER BY is_accepted DESC, quote_version DESC
  LIMIT 1;
  
  -- 6. Invoiced amount (sum of all invoices)
  SELECT COALESCE(SUM(total), 0) INTO v_invoiced_amount
  FROM invoices
  WHERE job_id = p_job_id;
  
  -- 7. Paid amount (sum of paid invoices)
  SELECT COALESCE(SUM(total), 0) INTO v_paid_amount
  FROM invoices
  WHERE job_id = p_job_id
    AND status = 'paid';
  
  -- Update job with all totals
  UPDATE jobs SET
    total_material_cost = v_material_cost,
    total_labour_cost = v_labour_cost,
    total_acquisition_cost = v_acquisition_cost,
    total_subcontractor_cost = v_subcontractor_cost,
    total_cost = v_material_cost + v_labour_cost + v_acquisition_cost + v_subcontractor_cost,
    
    quoted_amount = v_quoted_amount,
    invoiced_amount = v_invoiced_amount,
    paid_amount = v_paid_amount,
    
    gross_profit = v_invoiced_amount - (v_material_cost + v_labour_cost + v_acquisition_cost + v_subcontractor_cost),
    margin = CASE 
      WHEN v_invoiced_amount > 0 
      THEN ((v_invoiced_amount - (v_material_cost + v_labour_cost + v_acquisition_cost + v_subcontractor_cost)) / v_invoiced_amount * 100)
      ELSE 0 
    END
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS TO AUTO-UPDATE JOB TOTALS
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_job_totals_update()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    v_job_id = OLD.job_id;
  ELSE
    v_job_id = NEW.job_id;
  END IF;
  
  -- Update job totals when related data changes
  IF v_job_id IS NOT NULL THEN
    PERFORM calculate_job_totals(v_job_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_from_invoices ON invoices;
CREATE TRIGGER update_job_from_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_job_totals_update();

DROP TRIGGER IF EXISTS update_job_from_timesheets ON timesheet_entries;
CREATE TRIGGER update_job_from_timesheets
  AFTER INSERT OR UPDATE OR DELETE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_job_totals_update();

DROP TRIGGER IF EXISTS update_job_from_quotes ON quotes;
CREATE TRIGGER update_job_from_quotes
  AFTER INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_job_totals_update();

-- =====================================================
-- AUTO-UPDATE JOB STATUS BASED ON ACTIVITY
-- =====================================================
CREATE OR REPLACE FUNCTION update_job_status()
RETURNS TRIGGER AS $$
DECLARE
  v_job_status TEXT;
  v_job_id UUID;
BEGIN
  -- Get job_id
  IF TG_OP = 'DELETE' THEN
    v_job_id = OLD.job_id;
  ELSE
    v_job_id = NEW.job_id;
  END IF;
  
  IF v_job_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get current job status
  SELECT status INTO v_job_status
  FROM jobs
  WHERE id = v_job_id;
  
  -- Auto-update status based on activity
  IF TG_TABLE_NAME = 'quotes' AND TG_OP != 'DELETE' THEN
    IF NEW.status = 'sent' AND v_job_status = 'enquiry' THEN
      UPDATE jobs SET status = 'quoted' WHERE id = v_job_id;
    END IF;
    
    IF NEW.is_accepted = true AND v_job_status IN ('enquiry', 'quoted') THEN
      UPDATE jobs SET status = 'approved' WHERE id = v_job_id;
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'timesheet_entries' AND TG_OP = 'INSERT' THEN
    IF NEW.event_type = 'work' AND v_job_status = 'approved' THEN
      UPDATE jobs SET status = 'in_progress' WHERE id = v_job_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_status_from_quotes ON quotes;
CREATE TRIGGER update_job_status_from_quotes
  AFTER INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_job_status();

DROP TRIGGER IF EXISTS update_job_status_from_timesheets ON timesheet_entries;
CREATE TRIGGER update_job_status_from_timesheets
  AFTER INSERT ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_job_status();
