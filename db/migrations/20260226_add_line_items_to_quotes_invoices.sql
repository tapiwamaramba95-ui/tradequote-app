-- Migration: Add line_items JSONB column to quotes and invoices tables

-- Add line_items column to quotes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'line_items') THEN
    ALTER TABLE quotes ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add line_items column to invoices table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'line_items') THEN
    ALTER TABLE invoices ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add missing columns to quotes table for completeness
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'subtotal') THEN
    ALTER TABLE quotes ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'tax') THEN
    ALTER TABLE quotes ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'terms') THEN
    ALTER TABLE quotes ADD COLUMN terms TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'valid_until') THEN
    ALTER TABLE quotes ADD COLUMN valid_until DATE;
  END IF;
END $$;

-- Add missing columns to invoices table for completeness
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
    ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax') THEN
    ALTER TABLE invoices ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
    ALTER TABLE invoices ADD COLUMN terms TEXT;
  END IF;
END $$;

-- Add view_token to invoices if not exists (for customer viewing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'view_token') THEN
    ALTER TABLE invoices ADD COLUMN view_token TEXT UNIQUE;
  END IF;
END $$;

-- Add token expiration to both tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'token_expires_at') THEN
    ALTER TABLE quotes ADD COLUMN token_expires_at TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'token_expires_at') THEN
    ALTER TABLE invoices ADD COLUMN token_expires_at TIMESTAMP;
  END IF;
END $$;