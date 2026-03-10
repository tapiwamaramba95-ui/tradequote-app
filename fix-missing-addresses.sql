-- ============================================
-- BACKFILL MISSING ADDRESSES - COMPREHENSIVE VERSION
-- ============================================
-- Run this in your Supabase SQL editor to fix missing addresses

-- STEP 1: First, let's see what needs fixing and identify data patterns
SELECT 
  'client' as table_name,
  id,
  name,
  email,
  address,
  length(address) as addr_length,
  CASE 
    WHEN address IS NULL THEN 'NULL'
    WHEN address = '' THEN 'EMPTY'
    WHEN address = 'Address to be confirmed' THEN 'PLACEHOLDER'
    WHEN address = 'Not provided' THEN 'NOT_PROVIDED'
    WHEN address LIKE '%,%' THEN 'COMMA_SEPARATED'
    WHEN address LIKE '%\n%' THEN 'MULTILINE'
    ELSE 'SINGLE_LINE'
  END as issue_type,
  created_at
FROM clients 
WHERE address IS NULL 
   OR address = '' 
   OR address = 'Address to be confirmed' 
   OR address = 'Not provided'

UNION ALL

SELECT 
  'job' as table_name,
  id,
  job_name as name,
  '' as email,
  job_address as address,
  length(job_address) as addr_length,
  CASE 
    WHEN job_address IS NULL THEN 'NULL'
    WHEN job_address = '' THEN 'EMPTY'
    WHEN job_address = 'Address to be confirmed' THEN 'PLACEHOLDER' 
    WHEN job_address = 'Not provided' THEN 'NOT_PROVIDED'
    WHEN job_address LIKE '%,%' THEN 'COMMA_SEPARATED'
    WHEN job_address LIKE '%\n%' THEN 'MULTILINE'
    ELSE 'SINGLE_LINE'
  END as issue_type,
  created_at
FROM jobs 
WHERE job_address IS NULL 
   OR job_address = '' 
   OR job_address = 'Address to be confirmed' 
   OR job_address = 'Not provided'
ORDER BY table_name, created_at DESC;

-- STEP 2: Look for original enquiry data that might have been lost
SELECT 
  'ENQUIRY_DATA' as type,
  j.enquiry_number,
  j.job_name,
  j.job_address,
  j.description,
  c.name as client_name,
  c.email,
  c.address as client_address,
  j.enquiry_source,
  j.created_at
FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
WHERE j.status = 'enquiry'
  AND j.enquiry_number IN ('ENQ0001', 'ENQ0002', 'ENQ0003')
ORDER BY j.created_at DESC;

-- ============================================
-- UNCOMMMENT BELOW TO APPLY FIXES
-- ============================================

-- Option 1: Set all empty/missing addresses to a standard placeholder
/*
UPDATE clients 
SET address = 'Address to be provided by client'
WHERE address IS NULL 
   OR address = '' 
   OR address = 'Address to be confirmed';

UPDATE jobs 
SET job_address = 'Address to be provided by client'  
WHERE job_address IS NULL 
   OR job_address = '' 
   OR job_address = 'Address to be confirmed';
*/

-- Option 2: Try to copy client address to job address where missing
/*
UPDATE jobs 
SET job_address = clients.address
FROM clients 
WHERE jobs.client_id = clients.id 
  AND (jobs.job_address IS NULL OR jobs.job_address = '' OR jobs.job_address = 'Address to be confirmed')
  AND clients.address IS NOT NULL 
  AND clients.address != '' 
  AND clients.address != 'Address to be confirmed';
*/

-- Option 3: Restore known enquiry addresses (replace with actual submitted data)
/*
-- Based on your enquiry list, here are the addresses that should exist:
-- ENQ0003: Test Master - Address unknown (user needs to provide)
-- ENQ0002: Tapiwa - 89 Sellick drive Croydon VIC 3136  
-- ENQ0001: Tapiwa - 89 sellick drive, croydon, vic 3136 (different formatting)

-- Update ENQ0002 and ENQ0001 with the Sellick drive address
UPDATE clients 
SET address = '89 Sellick Drive\nCroydon VIC 3136'
WHERE name = 'Tapiwa' 
  AND email = 'tapiwa.maramba95@gmail.com';

UPDATE jobs 
SET job_address = '89 Sellick Drive\nCroydon VIC 3136'
WHERE enquiry_number IN ('ENQ0001', 'ENQ0002')
  AND client_id IN (
    SELECT id FROM clients 
    WHERE name = 'Tapiwa' AND email = 'tapiwa.maramba95@gmail.com'
  );

-- For Test Master, set a placeholder until real address is known
UPDATE clients 
SET address = 'Address to be provided by client'
WHERE name = 'Test Master' AND email = 'tappz.m1@gmail.com';

UPDATE jobs 
SET job_address = 'Address to be provided by client'
WHERE enquiry_number = 'ENQ0003'
  AND client_id IN (
    SELECT id FROM clients 
    WHERE name = 'Test Master' AND email = 'tappz.m1@gmail.com'
  );
*/