-- Migration: Add default_tax_rate to business_settings

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'default_tax_rate') THEN
    ALTER TABLE business_settings ADD COLUMN default_tax_rate DECIMAL(5,2) DEFAULT 10.0;
  END IF;
END $$;