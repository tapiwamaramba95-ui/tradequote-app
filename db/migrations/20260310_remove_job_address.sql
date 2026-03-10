-- ============================================
-- REMOVE JOB_ADDRESS FIELD 
-- ============================================
-- Simplify by removing job-specific addresses and only using client addresses

-- Backup existing job_address data before dropping
ALTER TABLE jobs ADD COLUMN job_address_backup TEXT;
UPDATE jobs SET job_address_backup = job_address WHERE job_address IS NOT NULL;

-- Drop the job_address column
ALTER TABLE jobs DROP COLUMN job_address;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that job_address column is gone
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name IN ('job_address', 'job_address_backup');

-- Verify jobs still have structured address fields if needed
SELECT 
  job_number,
  street_address,
  suburb,
  state,
  postcode,
  job_address_backup as original_job_address
FROM jobs 
WHERE job_address_backup IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;