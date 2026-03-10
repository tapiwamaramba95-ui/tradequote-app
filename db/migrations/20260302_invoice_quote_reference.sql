-- Migration: Add quote_id reference to invoices table
-- This allows tracking which quote an invoice was converted from

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'quote_id') THEN
    ALTER TABLE invoices ADD COLUMN quote_id uuid REFERENCES quotes(id);
  END IF;
END $$;
