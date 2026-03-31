-- Add details_completed column to suppliers table
-- This tracks whether the supplier has complete contact/address information

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS details_completed BOOLEAN DEFAULT false;

-- Update existing suppliers to mark them as complete if they have required fields
UPDATE suppliers
SET details_completed = (
  name IS NOT NULL AND 
  name != '' AND
  email IS NOT NULL AND 
  email != '' AND
  phone IS NOT NULL AND 
  phone != ''
);

-- Add comment for documentation
COMMENT ON COLUMN suppliers.details_completed IS 'Indicates if supplier has complete details (name, email, phone)';
