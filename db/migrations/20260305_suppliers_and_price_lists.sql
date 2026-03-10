-- =====================================================
-- SUPPLIERS AND PRICE LIST SYSTEM
-- Date: 2026-03-05
-- =====================================================

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Required
  name TEXT NOT NULL,
  
  -- Optional contact details
  abn TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  
  -- Metadata
  auto_created BOOLEAN DEFAULT false, -- Created from price list upload
  details_completed BOOLEAN DEFAULT false, -- User added contact details
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate suppliers per user
  UNIQUE(user_id, name)
);

-- =====================================================
-- SUPPLIER PRODUCTS (PRICE LIST)
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Product details
  product_code TEXT, -- Supplier's SKU/code
  product_name TEXT NOT NULL,
  description TEXT,
  
  unit TEXT NOT NULL, -- 'each', 'meter', 'kg', 'box', 'liter'
  price DECIMAL(10,2) NOT NULL,
  
  category TEXT, -- 'Plumbing', 'Electrical', 'Hardware', 'Paint'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate products per supplier
  UNIQUE(supplier_id, product_code)
);

-- =====================================================
-- PURCHASE ORDERS (Enhanced version)
-- =====================================================
-- Check if purchase_orders table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'purchase_orders') THEN
    CREATE TABLE purchase_orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES profiles(id) NOT NULL,
      job_id UUID REFERENCES jobs(id),
      supplier_id UUID REFERENCES suppliers(id) NOT NULL,
      
      po_number TEXT UNIQUE NOT NULL,
      order_date DATE DEFAULT CURRENT_DATE,
      required_date DATE,
      delivery_address TEXT,
      
      status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'received', 'cancelled'
      
      subtotal DECIMAL(10,2) DEFAULT 0,
      tax DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) DEFAULT 0,
      
      notes TEXT,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  ELSE
    -- If table exists, ensure supplier_id column is present
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'supplier_id'
    ) THEN
      ALTER TABLE purchase_orders ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
    END IF;
  END IF;
END $$;

-- =====================================================
-- PURCHASE ORDER ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  supplier_product_id UUID REFERENCES supplier_products(id),
  
  -- Snapshot values at time of order
  product_name TEXT NOT NULL,
  product_code TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers(name);

CREATE INDEX IF NOT EXISTS supplier_products_supplier_id_idx ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS supplier_products_user_id_idx ON supplier_products(user_id);
CREATE INDEX IF NOT EXISTS supplier_products_name_idx ON supplier_products(product_name);
CREATE INDEX IF NOT EXISTS supplier_products_code_idx ON supplier_products(product_code);

CREATE INDEX IF NOT EXISTS purchase_orders_user_id_idx ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_id_idx ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_job_id_idx ON purchase_orders(job_id);

CREATE INDEX IF NOT EXISTS purchase_order_items_po_id_idx ON purchase_order_items(po_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users manage own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users manage own supplier_products" ON supplier_products;
DROP POLICY IF EXISTS "Users manage own purchase_order_items" ON purchase_order_items;

-- Create new policies
CREATE POLICY "Users manage own suppliers" ON suppliers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own supplier_products" ON supplier_products
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own purchase_order_items" ON purchase_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.po_id
      AND purchase_orders.user_id = auth.uid()
    )
  );

-- Enable RLS on purchase_orders if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'purchase_orders' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create purchase_orders policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_orders' 
    AND policyname = 'Users manage own purchase_orders'
  ) THEN
    CREATE POLICY "Users manage own purchase_orders" ON purchase_orders
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- AUTO-INCREMENT PO NUMBERS
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PO' || LPAD(nextval('po_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
