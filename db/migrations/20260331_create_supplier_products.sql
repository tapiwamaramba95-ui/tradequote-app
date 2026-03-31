-- =====================================================
-- CREATE SUPPLIER_PRODUCTS TABLE
-- Date: 2026-03-31
-- Purpose: Create supplier_products table for supplier price lists
-- =====================================================

-- Create supplier_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Product details
  product_code TEXT,
  product_name TEXT NOT NULL,
  description TEXT,
  
  unit TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  
  category TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate products per supplier
  CONSTRAINT supplier_products_unique_code UNIQUE(supplier_id, product_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_business_id ON supplier_products(business_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_user_id ON supplier_products(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_supplier_products_is_active ON supplier_products(is_active);

-- Enable RLS
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business members access supplier products" ON supplier_products;

-- Create RLS policy for business-level access
CREATE POLICY "Business members access supplier products" ON supplier_products
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Verification query (commented out - uncomment to check)
-- SELECT COUNT(*) as total_supplier_products FROM supplier_products;
