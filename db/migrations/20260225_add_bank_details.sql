-- Migration to add bank account details for invoices
-- Date: 2026-02-25

DO $$
BEGIN
  -- Add bank_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN bank_name TEXT DEFAULT '';
  END IF;
  
  -- Add bsb column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'bsb'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN bsb TEXT DEFAULT '';
  END IF;
  
  -- Add account_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'account_number'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN account_number TEXT DEFAULT '';
  END IF;
  
  -- Add account_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'account_name'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN account_name TEXT DEFAULT '';
  END IF;
END $$;