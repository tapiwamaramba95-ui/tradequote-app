-- =====================================================
-- SYNC DATABASE TO PRODUCTION STATE
-- =====================================================
-- This ensures all tables have the necessary columns
-- based on the last deployment on GitHub
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- CLIENTS TABLE with Structured Addresses
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  street_address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'user_id') THEN
    ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street_address') THEN
    ALTER TABLE clients ADD COLUMN street_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'suburb') THEN
    ALTER TABLE clients ADD COLUMN suburb TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
    ALTER TABLE clients ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postcode') THEN
    ALTER TABLE clients ADD COLUMN postcode TEXT;
  END IF;
END $$;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own clients" ON clients;
CREATE POLICY "Users manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);

-- =====================================================
-- JOBS TABLE with Structured Addresses
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_number TEXT,
  job_name TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'quoted',
  client_id UUID REFERENCES clients(id),
  scheduled_date DATE,
  completion_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  street_address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  description TEXT,
  enquiry_source TEXT,
  enquiry_number VARCHAR(20) UNIQUE,
  enquiry_date TIMESTAMP DEFAULT NOW(),
  quoted_amount DECIMAL(10,2),
  invoiced_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  total_cost DECIMAL(10,2) DEFAULT 0,
  gross_profit DECIMAL(10,2) DEFAULT 0,
  margin DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing jobs table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
    ALTER TABLE jobs ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'job_name') THEN
    ALTER TABLE jobs ADD COLUMN job_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'street_address') THEN
    ALTER TABLE jobs ADD COLUMN street_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'suburb') THEN
    ALTER TABLE jobs ADD COLUMN suburb TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'state') THEN
    ALTER TABLE jobs ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'postcode') THEN
    ALTER TABLE jobs ADD COLUMN postcode TEXT;
  END IF;
  -- Enquiry fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'description') THEN
    ALTER TABLE jobs ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'enquiry_source') THEN
    ALTER TABLE jobs ADD COLUMN enquiry_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'enquiry_number') THEN
    ALTER TABLE jobs ADD COLUMN enquiry_number VARCHAR(20) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'enquiry_date') THEN
    ALTER TABLE jobs ADD COLUMN enquiry_date TIMESTAMP DEFAULT NOW();
  END IF;
  -- Financial tracking fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'quoted_amount') THEN
    ALTER TABLE jobs ADD COLUMN quoted_amount DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'invoiced_amount') THEN
    ALTER TABLE jobs ADD COLUMN invoiced_amount DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'paid_amount') THEN
    ALTER TABLE jobs ADD COLUMN paid_amount DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'total_cost') THEN
    ALTER TABLE jobs ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'gross_profit') THEN
    ALTER TABLE jobs ADD COLUMN gross_profit DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'margin') THEN
    ALTER TABLE jobs ADD COLUMN margin DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own jobs" ON jobs;
CREATE POLICY "Users manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);

-- Handle job_status enum if it exists, or create constraint
DO $$
BEGIN
  -- Check if status column uses an enum type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name = 'status' 
    AND udt_name LIKE '%job_status%'
  ) THEN
    -- If enum exists, add 'enquiry' to it if not present
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname LIKE '%job_status%' AND e.enumlabel = 'enquiry'
    ) THEN
      ALTER TYPE job_status ADD VALUE 'enquiry';
    END IF;
  ELSE
    -- If not an enum, ensure it's TEXT and add check constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'status') THEN
      -- Drop existing constraint if any
      ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
      -- Add new constraint including 'enquiry'
      ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
        CHECK (status IN ('enquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'));
    END IF;
  END IF;
END $$;

-- Now that 'enquiry' is a valid value, update the default
-- Note: Only do this if you want 'enquiry' as the default for new records
-- ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'enquiry';

CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_client_id_idx ON jobs(client_id);

-- =====================================================
-- QUOTES TABLE with Line Items
-- =====================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]'::jsonb,
  terms TEXT,
  valid_until DATE,
  view_token TEXT UNIQUE,
  token_expires_at TIMESTAMP,
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing quotes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'user_id') THEN
    ALTER TABLE quotes ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'line_items') THEN
    ALTER TABLE quotes ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'subtotal') THEN
    ALTER TABLE quotes ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'tax') THEN
    ALTER TABLE quotes ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'terms') THEN
    ALTER TABLE quotes ADD COLUMN terms TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'valid_until') THEN
    ALTER TABLE quotes ADD COLUMN valid_until DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'token_expires_at') THEN
    ALTER TABLE quotes ADD COLUMN token_expires_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'view_token') THEN
    ALTER TABLE quotes ADD COLUMN view_token TEXT UNIQUE;
  END IF;
END $$;

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own quotes" ON quotes;
CREATE POLICY "Users manage own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view quote with token" ON quotes;
CREATE POLICY "Anyone can view quote with token" ON quotes FOR SELECT USING (view_token IS NOT NULL);

CREATE INDEX IF NOT EXISTS quotes_user_id_idx ON quotes(user_id);
CREATE INDEX IF NOT EXISTS quotes_view_token_idx ON quotes(view_token);
CREATE INDEX IF NOT EXISTS quotes_job_id_idx ON quotes(job_id);
CREATE INDEX IF NOT EXISTS quotes_client_id_idx ON quotes(client_id);

-- =====================================================
-- INVOICES TABLE with Line Items
-- =====================================================
-- Note: There might be conflicts if purchase_orders migration created an invoices table
-- This handles the customer invoices (not supplier invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]'::jsonb,
  terms TEXT,
  view_token TEXT UNIQUE,
  token_expires_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing invoices table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
    ALTER TABLE invoices ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'line_items') THEN
    ALTER TABLE invoices ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
    ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax') THEN
    ALTER TABLE invoices ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
    ALTER TABLE invoices ADD COLUMN terms TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'view_token') THEN
    ALTER TABLE invoices ADD COLUMN view_token TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'token_expires_at') THEN
    ALTER TABLE invoices ADD COLUMN token_expires_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_id') THEN
    ALTER TABLE invoices ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'job_id') THEN
    ALTER TABLE invoices ADD COLUMN job_id UUID REFERENCES jobs(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
    ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
    ALTER TABLE invoices ADD COLUMN issue_date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
    ALTER TABLE invoices ADD COLUMN due_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount_paid') THEN
    ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
CREATE POLICY "Users manage own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view invoice with token" ON invoices;
CREATE POLICY "Anyone can view invoice with token" ON invoices FOR SELECT USING (view_token IS NOT NULL);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_job_id_idx ON invoices(job_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_view_token_idx ON invoices(view_token);

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reference TEXT,
  supplier_id UUID,
  status TEXT DEFAULT 'draft',
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id to purchase_orders if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'user_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own purchase orders" ON purchase_orders;
CREATE POLICY "Users manage own purchase orders" ON purchase_orders FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS purchase_orders_user_id_idx ON purchase_orders(user_id);

-- =====================================================
-- ENQUIRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'user_id') THEN
    ALTER TABLE enquiries ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own enquiries" ON enquiries;
CREATE POLICY "Users manage own enquiries" ON enquiries FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON enquiries(user_id);

-- =====================================================
-- ENQUIRY NUMBER GENERATION (for jobs with status='enquiry')
-- =====================================================
-- Function to generate next enquiry number
CREATE OR REPLACE FUNCTION generate_enquiry_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_num INTEGER;
  new_number VARCHAR(20);
BEGIN
  -- Get the highest existing enquiry number
  SELECT 
    COALESCE(
    MAX(CAST(SUBSTRING(enquiry_number FROM 4) AS INTEGER)), 
    0
  ) + 1 INTO next_num
  FROM jobs 
  WHERE enquiry_number ~ '^ENQ[0-9]+$';
  
  -- Format as ENQ#### (e.g., ENQ0001, ENQ0002, etc.)
  new_number := 'ENQ' || LPAD(next_num::VARCHAR, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set enquiry_number automatically
CREATE OR REPLACE FUNCTION set_enquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'enquiry' AND (NEW.enquiry_number IS NULL OR NEW.enquiry_number = '') THEN
    NEW.enquiry_number := generate_enquiry_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
DROP TRIGGER IF EXISTS before_insert_job_enquiry_number ON jobs;
CREATE TRIGGER before_insert_job_enquiry_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();

-- Trigger for UPDATE
DROP TRIGGER IF EXISTS before_update_job_enquiry_number ON jobs;
CREATE TRIGGER before_update_job_enquiry_number
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();

-- Create index for enquiry_number
CREATE INDEX IF NOT EXISTS idx_jobs_enquiry_number ON jobs(enquiry_number);
CREATE INDEX IF NOT EXISTS jobs_enquiry_source_idx ON jobs(enquiry_source);

-- =====================================================
-- BACKFILL ENQUIRY NUMBERS (RUN AFTER MIGRATION COMPLETES)
-- =====================================================
-- Note: This must be run in a SEPARATE transaction after the above migration
-- completes, because the new enum value 'enquiry' must be committed first.
-- 
-- Uncomment and run this query separately if you have existing jobs with status='enquiry':
--
-- UPDATE jobs
-- SET enquiry_number = 'ENQ' || LPAD(row_number() OVER (ORDER BY created_at)::VARCHAR, 4, '0')
-- WHERE status = 'enquiry'
--     AND (enquiry_number IS NULL OR enquiry_number = '');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked

-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check clients table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Check jobs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Check quotes table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
ORDER BY ordinal_position;

-- Check invoices table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Check purchase_orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
ORDER BY ordinal_position;
