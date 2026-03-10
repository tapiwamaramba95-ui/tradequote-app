-- Look for the actual enquiry data in the database
-- This should show us what was actually stored

-- Check if the addresses exist in any format
SELECT 'clients' as table_name, id, name, email, address, created_at
FROM clients 
WHERE address ILIKE '%sellick%' 
   OR address ILIKE '%croydon%'
   OR address ILIKE '%3136%'

UNION ALL

SELECT 'jobs' as table_name, id, job_name as name, '' as email, job_address as address, created_at  
FROM jobs 
WHERE job_address ILIKE '%sellick%' 
   OR job_address ILIKE '%croydon%'
   OR job_address ILIKE '%3136%'

UNION ALL

-- Check if there might be enquiry-specific data stored somewhere
SELECT 'other_check' as table_name, 
       enquiry_number::text as id, 
       job_name as name,
       '' as email,
       job_address as address,
       created_at
FROM jobs 
WHERE enquiry_number IN ('ENQ0001', 'ENQ0002', 'ENQ0003')
ORDER BY created_at DESC;

-- Show all recent enquiry submissions to see patterns
SELECT 
  j.enquiry_number,
  j.job_name,
  j.job_address,
  j.description,
  c.name,
  c.email,
  c.address as client_address,
  j.created_at
FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
WHERE j.status = 'enquiry'
ORDER BY j.created_at DESC
LIMIT 10;