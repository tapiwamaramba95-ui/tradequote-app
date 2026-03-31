-- =====================================================
-- MATERIAL PACKAGES SYSTEM
-- Date: 2026-03-31
-- Purpose: Add reusable material packages and migrate price_list_items to business_id
-- =====================================================

-- =====================================================
-- STEP 1: MIGRATE PRICE_LIST_ITEMS TO BUSINESS_ID
-- =====================================================

-- Add business_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_list_items' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE price_list_items ADD COLUMN business_id UUID REFERENCES businesses(id);
  END IF;
END $$;

-- Migrate existing data: user_id -> business_id
-- Get business_id from staff table where staff.user_id = price_list_items.user_id
UPDATE price_list_items
SET business_id = staff.business_id
FROM staff
WHERE price_list_items.user_id = staff.user_id
  AND price_list_items.business_id IS NULL;

-- For any items without a match in staff, try to get business_id from business_settings
UPDATE price_list_items
SET business_id = business_settings.business_id
FROM business_settings
WHERE price_list_items.user_id = business_settings.user_id
  AND price_list_items.business_id IS NULL;

-- Add index for business_id
CREATE INDEX IF NOT EXISTS price_list_items_business_id_idx ON price_list_items(business_id);

-- Update RLS policies for price_list_items to use business_id
DROP POLICY IF EXISTS "Users manage own price_list_items" ON price_list_items;
DROP POLICY IF EXISTS "Business members access price list" ON price_list_items;

CREATE POLICY "Business members access price list" ON price_list_items
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 2: CREATE MATERIAL_PACKAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS material_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Package details
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS material_packages_business_id_idx ON material_packages(business_id);
CREATE INDEX IF NOT EXISTS material_packages_category_idx ON material_packages(category);
CREATE INDEX IF NOT EXISTS material_packages_name_idx ON material_packages(name);

-- RLS
ALTER TABLE material_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members access packages" ON material_packages;
CREATE POLICY "Business members access packages" ON material_packages
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 3: CREATE MATERIAL_PACKAGE_ITEMS TABLE (Junction)
-- =====================================================

CREATE TABLE IF NOT EXISTS material_package_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES material_packages(id) ON DELETE CASCADE NOT NULL,
  price_list_item_id UUID REFERENCES price_list_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Snapshot data (cost at time of adding to package)
  item_name TEXT NOT NULL,
  item_description TEXT,
  supplier TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL, -- Cost at time of adding
  line_total DECIMAL(10,2) NOT NULL, -- quantity × unit_cost
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate items in same package
  UNIQUE(package_id, price_list_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS material_package_items_package_id_idx ON material_package_items(package_id);
CREATE INDEX IF NOT EXISTS material_package_items_price_list_item_id_idx ON material_package_items(price_list_item_id);

-- RLS (inherit from package)
ALTER TABLE material_package_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members access package items" ON material_package_items;
CREATE POLICY "Business members access package items" ON material_package_items
  FOR ALL USING (
    package_id IN (
      SELECT id FROM material_packages 
      WHERE business_id IN (
        SELECT business_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- STEP 4: ADD HELPFUL FUNCTIONS
-- =====================================================

-- Function to calculate total package cost
CREATE OR REPLACE FUNCTION get_package_total_cost(p_package_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(line_total), 0)
  FROM material_package_items
  WHERE package_id = p_package_id;
$$ LANGUAGE SQL STABLE;

-- Function to get package item count
CREATE OR REPLACE FUNCTION get_package_item_count(p_package_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM material_package_items
  WHERE package_id = p_package_id;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- STEP 5: UPDATE TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_material_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS material_packages_updated_at ON material_packages;
CREATE TRIGGER material_packages_updated_at
  BEFORE UPDATE ON material_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_material_packages_updated_at();

-- =====================================================
-- VERIFICATION QUERIES (Run these after migration)
-- =====================================================

-- Check price_list_items migration
-- SELECT 
--   COUNT(*) as total_items,
--   COUNT(business_id) as items_with_business_id,
--   COUNT(*) - COUNT(business_id) as items_without_business_id
-- FROM price_list_items;

-- Check material_packages
-- SELECT 
--   mp.name,
--   mp.category,
--   get_package_item_count(mp.id) as item_count,
--   get_package_total_cost(mp.id) as total_cost
-- FROM material_packages mp
-- ORDER BY mp.created_at DESC;
