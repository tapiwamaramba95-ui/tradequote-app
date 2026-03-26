-- Migration: Copy site address fields to job address fields
-- Date: 2026-03-23
-- Purpose: Copy data from site_street_address, site_suburb, site_state, site_postcode
--          into street_address, suburb, state, postcode fields in jobs table

-- Update jobs table to copy site address data to regular address fields
UPDATE jobs
SET 
  street_address = site_street_address,
  suburb = site_suburb,
  state = site_state,
  postcode = site_postcode
WHERE 
  site_street_address IS NOT NULL 
  OR site_suburb IS NOT NULL 
  OR site_state IS NOT NULL 
  OR site_postcode IS NOT NULL;

-- Verification query (run this to check results)
SELECT 
  job_number,
  site_street_address,
  street_address,
  site_suburb,
  suburb,
  site_state,
  state,
  site_postcode,
  postcode
FROM jobs
WHERE 
  site_street_address IS NOT NULL 
  OR site_suburb IS NOT NULL 
  OR site_state IS NOT NULL 
  OR site_postcode IS NOT NULL
ORDER BY job_number
LIMIT 10;
