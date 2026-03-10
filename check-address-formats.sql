-- Check what the actual address data looks like in the database
-- Run this first to see what we're working with

SELECT 
  'clients' as source,
  name,
  email,
  address,
  length(address) as addr_length,
  CASE 
    WHEN address LIKE '%\n%' THEN 'MULTILINE'
    WHEN address LIKE '%,%' THEN 'COMMA_SEPARATED' 
    WHEN address IS NULL THEN 'NULL'
    WHEN address = '' THEN 'EMPTY'
    WHEN address = 'Address to be confirmed' THEN 'PLACEHOLDER'
    ELSE 'SINGLE_LINE'
  END as format_type
FROM clients 
WHERE address IS NOT NULL
ORDER BY created_at DESC;

-- Check jobs table
SELECT 
  'jobs' as source,
  job_name,
  job_address,
  length(job_address) as addr_length,
  CASE 
    WHEN job_address LIKE '%\n%' THEN 'MULTILINE'
    WHEN job_address LIKE '%,%' THEN 'COMMA_SEPARATED'
    WHEN job_address IS NULL THEN 'NULL' 
    WHEN job_address = '' THEN 'EMPTY'
    WHEN job_address = 'Address to be confirmed' THEN 'PLACEHOLDER'
    ELSE 'SINGLE_LINE'
  END as format_type,
  created_at
FROM jobs 
WHERE job_address IS NOT NULL
ORDER BY created_at DESC;