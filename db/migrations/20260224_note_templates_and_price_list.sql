-- =====================================================
-- NOTE TEMPLATES AND PRICE LIST MIGRATION
-- Created: 2026-02-24
-- Purpose: Add note templates and price list items for faster document creation
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES IF THEY EXIST (Fresh Start)
-- =====================================================
DROP TABLE IF EXISTS note_templates CASCADE;
DROP TABLE IF EXISTS price_list_items CASCADE;

-- =====================================================
-- NOTE TEMPLATES TABLE
-- =====================================================
CREATE TABLE note_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX note_templates_user_id_idx ON note_templates(user_id);
CREATE INDEX note_templates_category_idx ON note_templates(category);

-- =====================================================
-- PRICE LIST ITEMS TABLE
-- =====================================================
CREATE TABLE price_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'each',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX price_list_items_user_id_idx ON price_list_items(user_id);
CREATE INDEX price_list_items_category_idx ON price_list_items(category);
CREATE INDEX price_list_items_name_idx ON price_list_items(name);

-- =====================================================
-- ADD DEFAULT MARKUP TO BUSINESS SETTINGS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'default_markup_percentage'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN default_markup_percentage DECIMAL(5,2) DEFAULT 30.00;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Note Templates Policies
DROP POLICY IF EXISTS "Users manage own note_templates" ON note_templates;
CREATE POLICY "Users manage own note_templates" ON note_templates 
  FOR ALL USING (auth.uid() = user_id);

-- Price List Items Policies
DROP POLICY IF EXISTS "Users manage own price_list_items" ON price_list_items;
CREATE POLICY "Users manage own price_list_items" ON price_list_items 
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA (Optional - for demo/testing)
-- =====================================================

-- Function to add sample data for new users
CREATE OR REPLACE FUNCTION seed_price_list_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only seed if user has no price list items
  IF NOT EXISTS (SELECT 1 FROM price_list_items WHERE user_id = p_user_id) THEN
    -- Sample materials
    INSERT INTO price_list_items (user_id, name, description, cost, unit, category)
    VALUES 
      (p_user_id, '2x4 Timber (8ft)', 'Standard 2x4 timber board, 8 feet length', 4.50, 'each', 'Materials'),
      (p_user_id, 'Copper Pipe (15mm)', '15mm copper pipe per meter', 8.25, 'meter', 'Materials'),
      (p_user_id, 'Electrical Cable (2.5mm)', '2.5mm twin and earth cable', 2.10, 'meter', 'Materials'),
      (p_user_id, 'Paint (5L)', 'Interior wall paint, 5 liter tin', 32.00, 'each', 'Materials'),
      (p_user_id, 'Cement Bag (25kg)', 'General purpose cement', 6.50, 'bag', 'Materials');
    
    -- Sample note templates
    INSERT INTO note_templates (user_id, name, content, category)
    VALUES
      (p_user_id, 'Standard Service Call', 'Service call includes inspection, diagnosis, and repair of the reported issue. All parts and materials are included in the quoted price. Work is guaranteed for 12 months.', 'General'),
      (p_user_id, 'Emergency Call Out', 'Emergency call out service - immediate response within 2 hours. Premium rates apply for after-hours service. Payment required upon completion.', 'General'),
      (p_user_id, 'Installation Work', 'Professional installation including all necessary materials, fittings, and testing. Site will be left clean and tidy. Certificate of compliance provided where required.', 'General');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
