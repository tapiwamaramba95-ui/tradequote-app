-- Migration: Add client_id columns to quotes and invoices tables
-- Run this in your Supabase SQL Editor

BEGIN;

-- Add client_id column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID;

-- Add foreign key constraint
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add client_id column to invoices table  
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID;

-- Add foreign key constraint
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Update existing quotes to get client_id from jobs
UPDATE quotes 
SET client_id = jobs.client_id 
FROM jobs 
WHERE quotes.job_id = jobs.id 
AND quotes.client_id IS NULL;

-- Update existing invoices to get client_id from jobs
UPDATE invoices 
SET client_id = jobs.client_id 
FROM jobs 
WHERE invoices.job_id = jobs.id 
AND invoices.client_id IS NULL;

COMMIT;

-- Verify the changes
SELECT 'quotes' as table_name, COUNT(*) as total_rows, COUNT(client_id) as rows_with_client_id FROM quotes
UNION ALL
SELECT 'invoices' as table_name, COUNT(*) as total_rows, COUNT(client_id) as rows_with_client_id FROM invoices;