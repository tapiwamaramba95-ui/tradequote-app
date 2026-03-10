-- =====================================================
-- PURCHASE ORDERS MODULE WITH PROFIT TRACKING
-- =====================================================
-- Run this in Supabase SQL Editor
-- This creates a complete PO system linked to Jobs for profit tracking

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  
  -- Address
  address TEXT,
  
  -- Business Details
  abn TEXT,
  account_number TEXT, -- Their account number with us
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id if table exists without it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id') THEN
    ALTER TABLE suppliers ADD COLUMN user_id UUID REFERENCES profiles(id);
  END IF;
END $$;

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- PO Number
  po_number TEXT NOT NULL UNIQUE,
  
  -- Relationships
  supplier_id UUID REFERENCES suppliers(id),
  job_id UUID REFERENCES jobs(id), -- CRITICAL: Links PO to Job for profit tracking
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, sent, received, billed
  
  -- Dates
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  received_date DATE,
  
  -- Line Items (JSONB for flexibility)
  line_items JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"description": "2x4 Timber", "quantity": 50, "unit_price": 8.50, "total": 425.00}]
  
  -- Totals
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  delivery_instructions TEXT,
  
  -- Email tracking
  view_token TEXT UNIQUE,
  token_expires_at TIMESTAMP,
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if table exists without them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'user_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN user_id UUID REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'job_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN job_id UUID REFERENCES jobs(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'line_items') THEN
    ALTER TABLE purchase_orders ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- =====================================================
-- BILLS TABLE (for received POs)
-- =====================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Bill Number
  bill_number TEXT NOT NULL,
  
  -- Relationships
  supplier_id UUID REFERENCES suppliers(id),
  job_id UUID REFERENCES jobs(id), -- Links to same job as PO
  purchase_order_id UUID REFERENCES purchase_orders(id), -- Links to PO
  
  -- Status
  status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  
  -- Dates
  bill_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  
  -- Amounts
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Payment tracking
  payment_method TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id if table exists without it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'user_id') THEN
    ALTER TABLE bills ADD COLUMN user_id UUID REFERENCES profiles(id);
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS suppliers_is_active_idx ON suppliers(is_active);

CREATE INDEX IF NOT EXISTS purchase_orders_user_id_idx ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_id_idx ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_job_id_idx ON purchase_orders(job_id);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_job_id_idx ON bills(job_id);
CREATE INDEX IF NOT EXISTS bills_po_id_idx ON bills(purchase_order_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own suppliers" ON suppliers;
CREATE POLICY "Users manage own suppliers" ON suppliers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own purchase_orders" ON purchase_orders;
CREATE POLICY "Users manage own purchase_orders" ON purchase_orders FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own bills" ON bills;
CREATE POLICY "Users manage own bills" ON bills FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- AUTO-NUMBER FUNCTION FOR POs
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_po_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
BEGIN
  -- Get prefix from settings (default 'PO')
  SELECT COALESCE(po_prefix, 'PO') INTO prefix
  FROM business_settings
  WHERE user_id = p_user_id;
  
  -- Get next number
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE user_id = p_user_id;
  
  RETURN prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to create sample suppliers
/*
INSERT INTO suppliers (user_id, name, email, phone, is_active)
VALUES 
  ((SELECT id FROM profiles LIMIT 1), 'Acme Building Supplies', 'sales@acme.com', '555-0100', true),
  ((SELECT id FROM profiles LIMIT 1), 'Global Trade Materials', 'info@globaltrade.com', '555-0200', true)
ON CONFLICT DO NOTHING;
*/
