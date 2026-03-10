-- Migration: Add missing tax_rate column to quotes table

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'tax_rate') THEN
    ALTER TABLE quotes ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 10.0;
  END IF;
END $$;

-- Add tax_rate column to invoices table as well for consistency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_rate') THEN
    ALTER TABLE invoices ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 10.0;
  END IF;
END $$;