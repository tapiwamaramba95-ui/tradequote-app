-- Migration: Ensure numbering columns exist and add business settings for all numbering

-- Add job_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'job_number'
  ) THEN
    ALTER TABLE jobs ADD COLUMN job_number TEXT;
  END IF;
END $$;

-- Add invoice_number column if it doesn't exist (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_number TEXT NOT NULL DEFAULT 'INV001';
  END IF;
END $$;

-- Add quote_number column if it doesn't exist (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'quote_number'
  ) THEN
    ALTER TABLE quotes ADD COLUMN quote_number TEXT NOT NULL DEFAULT 'Q001';
  END IF;
END $$;

-- Add invoice and quote numbering settings to business_settings if they don't exist
DO $$
BEGIN
  -- Add invoice_prefix column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'invoice_prefix'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
  END IF;
  
  -- Add invoice_start_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'invoice_start_number'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN invoice_start_number INTEGER DEFAULT 1;
  END IF;
  
  -- Add quote_prefix column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'quote_prefix'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN quote_prefix TEXT DEFAULT 'Q';
  END IF;
  
  -- Add quote_start_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'quote_start_number'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN quote_start_number INTEGER DEFAULT 1;
  END IF;
END $$;
