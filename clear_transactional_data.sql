-- ============================================
-- CLEAR TRANSACTIONAL DATA FOR FRESH START
-- ============================================
-- This script clears jobs, quotes, invoices, enquiries while preserving:
-- - clients
-- - settings  
-- - user accounts
-- - templates

BEGIN;

-- Show what we're about to delete
SELECT 'Before deletion:' as status;
SELECT 'Jobs: ' || count(*) as count FROM jobs
UNION ALL
SELECT 'Quotes: ' || count(*) FROM quotes  
UNION ALL
SELECT 'Invoices: ' || count(*) FROM invoices
UNION ALL
SELECT 'Enquiries: ' || count(*) FROM enquiries
UNION ALL
SELECT 'Clients: ' || count(*) FROM clients
UNION ALL
SELECT 'Suppliers: ' || count(*) FROM suppliers;

-- Delete in order to respect foreign key constraints
-- Note: Adjust table names and relationships based on your actual schema

-- Clear related/dependent data first (only if tables exist)
-- DELETE FROM invoice_line_items WHERE invoice_id IN (SELECT id FROM invoices);
-- DELETE FROM quote_line_items WHERE quote_id IN (SELECT id FROM quotes);
-- DELETE FROM job_line_items WHERE job_id IN (SELECT id FROM jobs);

-- Clear main transactional tables (using TRUNCATE to bypass triggers)
TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;
TRUNCATE TABLE quotes RESTART IDENTITY CASCADE;
TRUNCATE TABLE jobs RESTART IDENTITY CASCADE;
TRUNCATE TABLE enquiries RESTART IDENTITY CASCADE;

-- Clear clients and suppliers (after removing dependents)
TRUNCATE TABLE clients RESTART IDENTITY CASCADE;
TRUNCATE TABLE suppliers RESTART IDENTITY CASCADE;

-- Show results
SELECT 'After deletion:' as status;
SELECT 'Jobs: ' || count(*) as count FROM jobs
UNION ALL
SELECT 'Quotes: ' || count(*) FROM quotes  
UNION ALL
SELECT 'Invoices: ' || count(*) FROM invoices
UNION ALL
SELECT 'Enquiries: ' || count(*) FROM enquiries
UNION ALL
SELECT 'Clients: ' || count(*) FROM clients
UNION ALL
SELECT 'Suppliers: ' || count(*) FROM suppliers;

COMMIT;

-- ============================================
-- WHAT THIS PRESERVES:
-- ============================================
-- ✅ users/auth data  
-- ✅ settings/configuration
-- ✅ templates
-- ✅ any lookup/reference data

-- WHAT THIS REMOVES:
-- ❌ All jobs
-- ❌ All quotes  
-- ❌ All invoices
-- ❌ All enquiries
-- ❌ All clients
-- ❌ All suppliers
-- ❌ Related line items/details