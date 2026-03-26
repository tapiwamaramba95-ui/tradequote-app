-- Backup tables
CREATE TABLE clients_backup AS SELECT * FROM clients;
CREATE TABLE suppliers_backup AS SELECT * FROM suppliers;
CREATE TABLE jobs_backup AS SELECT * FROM jobs;

-- Remove address columns
ALTER TABLE clients DROP COLUMN IF EXISTS address;
ALTER TABLE suppliers DROP COLUMN IF EXISTS address;
ALTER TABLE jobs DROP COLUMN IF EXISTS address;

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'clients';
SELECT column_name FROM information_schema.columns WHERE table_name = 'suppliers';
SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs';
