-- ============================================
-- CONVERT ADDRESS TO COMPUTED FIELD
-- ============================================
-- Make address a computed field based on structured address components

-- First, backup existing address data to a temporary column
ALTER TABLE clients ADD COLUMN address_backup TEXT;
UPDATE clients SET address_backup = address WHERE address IS NOT NULL;

-- Drop the existing address column
ALTER TABLE clients DROP COLUMN address;

-- Add address as a generated column that concatenates structured fields
ALTER TABLE clients ADD COLUMN address TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN street_address IS NOT NULL OR suburb IS NOT NULL OR state IS NOT NULL OR postcode IS NOT NULL
    THEN TRIM(
      COALESCE(street_address, '') || 
      CASE 
        WHEN (suburb IS NOT NULL OR state IS NOT NULL OR postcode IS NOT NULL) AND street_address IS NOT NULL
        THEN E'\n' || TRIM(COALESCE(suburb || ' ', '') || COALESCE(state || ' ', '') || COALESCE(postcode, ''))
        WHEN (suburb IS NOT NULL OR state IS NOT NULL OR postcode IS NOT NULL) AND street_address IS NULL
        THEN TRIM(COALESCE(suburb || ' ', '') || COALESCE(state || ' ', '') || COALESCE(postcode, ''))
        ELSE ''
      END
    )
    ELSE NULL
  END
) STORED;

-- Note: jobs table job_address will be removed separately via 20260310_remove_job_address.sql
-- Jobs will use client addresses only, no separate job address needed

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check clients computed addresses
SELECT 
  name,
  street_address,
  suburb,
  state,
  postcode,
  address as computed_address,
  address_backup as original_address
FROM clients 
WHERE street_address IS NOT NULL OR suburb IS NOT NULL OR state IS NOT NULL OR postcode IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;