-- ============================================
-- ADD STRUCTURED ADDRESS FIELDS
-- ============================================
-- Migration to add proper address structure to database

-- Add structured address fields to clients table
DO $$
BEGIN
  -- Street address field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street_address') THEN
    ALTER TABLE clients ADD COLUMN street_address TEXT;
  END IF;

  -- Suburb field  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'suburb') THEN
    ALTER TABLE clients ADD COLUMN suburb TEXT;
  END IF;

  -- State field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
    ALTER TABLE clients ADD COLUMN state TEXT;
  END IF;

  -- Postcode field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postcode') THEN
    ALTER TABLE clients ADD COLUMN postcode TEXT;
  END IF;
END $$;

-- Add structured address fields to jobs table  
DO $$
BEGIN
  -- Street address field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'street_address') THEN
    ALTER TABLE jobs ADD COLUMN street_address TEXT;
  END IF;

  -- Suburb field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'suburb') THEN
    ALTER TABLE jobs ADD COLUMN suburb TEXT;
  END IF;

  -- State field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'state') THEN
    ALTER TABLE jobs ADD COLUMN state TEXT;
  END IF;

  -- Postcode field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'postcode') THEN
    ALTER TABLE jobs ADD COLUMN postcode TEXT;
  END IF;
END $$;

-- ============================================
-- MIGRATE EXISTING ADDRESS DATA
-- ============================================
-- Move existing address data into street_address field
-- Leave suburb, state, postcode as NULL for manual entry

-- Migrate clients addresses to street_address field
UPDATE clients 
SET street_address = address
WHERE address IS NOT NULL AND address != '' AND street_address IS NULL;

-- Migrate jobs addresses to street_address field  
UPDATE jobs 
SET street_address = job_address
WHERE job_address IS NOT NULL AND job_address != '' AND street_address IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check that existing addresses were moved to street_address

-- Check clients migration results
SELECT 
  name,
  address as original_address,
  street_address,
  suburb, 
  state,
  postcode
FROM clients 
WHERE address IS NOT NULL AND address != ''
ORDER BY created_at DESC
LIMIT 10;

-- Check jobs migration results  
SELECT 
  job_number,
  job_address as original_address,
  street_address,
  suburb,
  state, 
  postcode
FROM jobs 
WHERE job_address IS NOT NULL AND job_address != ''
ORDER BY created_at DESC  
LIMIT 10;