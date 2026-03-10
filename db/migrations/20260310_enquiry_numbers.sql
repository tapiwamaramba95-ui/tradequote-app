-- =====================================================
-- ENQUIRY NUMBER SYSTEM MIGRATION  
-- =====================================================
-- Purpose: Add auto-generated enquiry numbers (ENQ0001 format)
-- Date: 2026-03-10

-- Add enquiry_number column to jobs table (since enquiries are stored there)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS enquiry_number VARCHAR(20) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_jobs_enquiry_number ON jobs(enquiry_number);

-- Function to generate next enquiry number
CREATE OR REPLACE FUNCTION generate_enquiry_number()
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  enquiry_num VARCHAR(20);
BEGIN
  -- Get the highest number from jobs where status = 'enquiry'
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(enquiry_number FROM 4) AS INTEGER)), 
    0
  ) + 1
  INTO next_num
  FROM jobs
  WHERE enquiry_number ~ '^ENQ[0-9]+$';
  
  -- Format with leading zeros (4 digits minimum)
  enquiry_num := 'ENQ' || LPAD(next_num::VARCHAR, 4, '0');
  
  RETURN enquiry_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set enquiry number on insert for enquiries
CREATE OR REPLACE FUNCTION set_enquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set enquiry number if this is an enquiry (status = 'enquiry')
  IF NEW.status = 'enquiry' AND (NEW.enquiry_number IS NULL OR NEW.enquiry_number = '') THEN
    NEW.enquiry_number := generate_enquiry_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new job insertions
DROP TRIGGER IF EXISTS before_insert_job_enquiry_number ON jobs;
CREATE TRIGGER before_insert_job_enquiry_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();

-- Create trigger for job updates (in case status changes to 'enquiry')
DROP TRIGGER IF EXISTS before_update_job_enquiry_number ON jobs;
CREATE TRIGGER before_update_job_enquiry_number
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();

-- Backfill existing enquiries with numbers
DO $$
DECLARE
  enq RECORD;
  counter INTEGER := 1;
BEGIN
  RAISE NOTICE 'Starting enquiry number backfill...';
  
  FOR enq IN 
    SELECT id FROM jobs 
    WHERE status = 'enquiry' 
    AND (enquiry_number IS NULL OR enquiry_number = '')
    ORDER BY created_at ASC
  LOOP
    UPDATE jobs 
    SET enquiry_number = 'ENQ' || LPAD(counter::VARCHAR, 4, '0')
    WHERE id = enq.id;
    
    RAISE NOTICE 'Assigned ENQ% to job %', LPAD(counter::VARCHAR, 4, '0'), enq.id;
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Enquiry number backfill completed! Assigned % numbers', counter - 1;
END $$;

-- Test the function
SELECT 
  id,
  job_name,
  enquiry_number,
  status,
  created_at
FROM jobs 
WHERE status = 'enquiry'
ORDER BY enquiry_number;