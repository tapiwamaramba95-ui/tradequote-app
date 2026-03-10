-- Add client_id to quotes and invoices tables for direct client relationship
-- This allows quotes and invoices to exist without jobs but still be linked to clients

-- Add client_id column to quotes table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_id UUID REFERENCES clients(id);
    CREATE INDEX IF NOT EXISTS quotes_client_id_idx ON quotes(client_id);
  END IF;
END $$;

-- Add client_id column to invoices table  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN client_id UUID REFERENCES clients(id);
    CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
  END IF;
END $$;

-- Backfill existing quotes with client_id from their job's client_id
UPDATE quotes 
SET client_id = jobs.client_id
FROM jobs 
WHERE quotes.job_id = jobs.id 
  AND quotes.client_id IS NULL 
  AND jobs.client_id IS NOT NULL;

-- Backfill existing invoices with client_id from their job's client_id
UPDATE invoices 
SET client_id = jobs.client_id
FROM jobs 
WHERE invoices.job_id = jobs.id 
  AND invoices.client_id IS NULL 
  AND jobs.client_id IS NOT NULL;