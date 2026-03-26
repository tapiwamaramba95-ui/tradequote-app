-- =====================================================
-- TRADEQUOTE BUSINESS MULTI-TENANCY MIGRATION
-- Date: March 22, 2026
-- Purpose: Convert from user-based to business-based data isolation
-- =====================================================

-- 1. CREATE BUSINESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trading_name TEXT,
  abn TEXT,
  acn TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Australia',
  logo_url TEXT,
  
  -- Business settings
  default_tax_rate DECIMAL(5,2) DEFAULT 10.00,
  currency TEXT DEFAULT 'AUD',
  timezone TEXT DEFAULT 'Australia/Sydney',
  
  -- Subscription/billing
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT businesses_name_check CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_businesses_name ON businesses(name);
CREATE INDEX idx_businesses_created_at ON businesses(created_at);


-- 2. CREATE USER_BUSINESSES JUNCTION TABLE (for permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  
  -- Individual permission flags (from your screenshot)
  can_access_timesheets BOOLEAN DEFAULT true,
  can_access_jobs BOOLEAN DEFAULT true,
  can_access_invoicing BOOLEAN DEFAULT true,
  can_access_quoting BOOLEAN DEFAULT true,
  can_access_purchases BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  can_access_scheduling BOOLEAN DEFAULT true,
  can_access_enquiries BOOLEAN DEFAULT true,
  can_access_staff_tracking BOOLEAN DEFAULT true,
  can_access_settings BOOLEAN DEFAULT false, -- Only for owners/admins
  can_access_staff_members BOOLEAN DEFAULT false, -- Only for owners/admins
  can_access_billing BOOLEAN DEFAULT false, -- Only for owners
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, business_id)
);

CREATE INDEX idx_user_businesses_user ON user_businesses(user_id);
CREATE INDEX idx_user_businesses_business ON user_businesses(business_id);
CREATE INDEX idx_user_businesses_active ON user_businesses(is_active);


-- 3. ADD BUSINESS_ID TO ALL DATA TABLES
-- =====================================================

-- Core business data tables
-- Clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_business ON clients(business_id);

-- Jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_jobs_business ON jobs(business_id);

-- Quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quotes_business ON quotes(business_id);

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);

-- Purchase Orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_business ON purchase_orders(business_id);

-- Enquiries
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_enquiries_business ON enquiries(business_id);

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);

-- Labour Rates
ALTER TABLE labour_rates ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_labour_rates_business ON labour_rates(business_id);

-- Payment Methods
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_business ON payment_methods(business_id);

-- Price List Items
ALTER TABLE price_list_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_price_list_items_business ON price_list_items(business_id);

-- Tax Rates
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tax_rates_business ON tax_rates(business_id);

-- Timesheets
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_timesheets_business ON timesheets(business_id);

-- Staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);

-- Business Settings (one per business)
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_business_settings_business ON business_settings(business_id);


-- 4. MIGRATE EXISTING DATA
-- =====================================================
-- Create one business per existing user and migrate their data

DO $$
DECLARE
  user_record RECORD;
  new_business_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM clients 
    WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id 
    FROM jobs 
    WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id 
    FROM invoices 
    WHERE user_id IS NOT NULL
  LOOP
    -- Create a business for this user
    INSERT INTO businesses (name, created_at)
    VALUES ('Business ' || substring(user_record.user_id::text, 1, 8), NOW())
    RETURNING id INTO new_business_id;
    
    -- Link user to their business as owner with full permissions
    INSERT INTO user_businesses (
      user_id, 
      business_id, 
      role,
      can_access_timesheets,
      can_access_jobs,
      can_access_invoicing,
      can_access_quoting,
      can_access_purchases,
      can_access_reports,
      can_access_scheduling,
      can_access_enquiries,
      can_access_staff_tracking,
      can_access_settings,
      can_access_staff_members,
      can_access_billing,
      joined_at
    ) VALUES (
      user_record.user_id,
      new_business_id,
      'owner',
      true, true, true, true, true, true, true, true, true, true, true, true,
      NOW()
    );
    
    -- Update all their data with the new business_id
    UPDATE clients SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE jobs SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE quotes SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE invoices SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE purchase_orders SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE enquiries SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE suppliers SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE appointments SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE labour_rates SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE payment_methods SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE price_list_items SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE tax_rates SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE timesheets SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE staff SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    UPDATE business_settings SET business_id = new_business_id WHERE user_id = user_record.user_id AND business_id IS NULL;
    
    RAISE NOTICE 'Migrated user % to business %', user_record.user_id, new_business_id;
  END LOOP;
END $$;


-- 5. MAKE BUSINESS_ID NOT NULL (after migration)
-- =====================================================
-- Only make NOT NULL for core tables that should have business_id
-- Optional tables (appointments, timesheets, etc.) can remain nullable

ALTER TABLE clients ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE purchase_orders ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE enquiries ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN business_id SET NOT NULL;

-- Optional tables - keep nullable since they might not have data yet
-- appointments, labour_rates, payment_methods, price_list_items, 
-- tax_rates, timesheets, staff, business_settings


-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's business_id
CREATE OR REPLACE FUNCTION get_user_business_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT business_id 
  FROM user_businesses 
  WHERE user_id = p_user_id 
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
  SELECT 
    CASE p_permission
      WHEN 'timesheets' THEN can_access_timesheets
      WHEN 'jobs' THEN can_access_jobs
      WHEN 'invoicing' THEN can_access_invoicing
      WHEN 'quoting' THEN can_access_quoting
      WHEN 'purchases' THEN can_access_purchases
      WHEN 'reports' THEN can_access_reports
      WHEN 'scheduling' THEN can_access_scheduling
      WHEN 'enquiries' THEN can_access_enquiries
      WHEN 'staff_tracking' THEN can_access_staff_tracking
      WHEN 'settings' THEN can_access_settings
      WHEN 'staff_members' THEN can_access_staff_members
      WHEN 'billing' THEN can_access_billing
      ELSE false
    END
  FROM user_businesses
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get user's role in business
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role
  FROM user_businesses
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;


-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only see their own business
CREATE POLICY businesses_select ON businesses
  FOR SELECT
  USING (
    id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY businesses_update ON businesses
  FOR UPDATE
  USING (
    id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- User Businesses: Users can see their own records
CREATE POLICY user_businesses_select ON user_businesses
  FOR SELECT
  USING (user_id = auth.uid());

-- Generic policy for data tables (clients, jobs, etc)
CREATE POLICY clients_access ON clients
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY jobs_access ON jobs
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_jobs = true
    )
  );

CREATE POLICY quotes_access ON quotes
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_quoting = true
    )
  );

CREATE POLICY invoices_access ON invoices
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_invoicing = true
    )
  );

CREATE POLICY purchase_orders_access ON purchase_orders
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_purchases = true
    )
  );

CREATE POLICY enquiries_access ON enquiries
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_enquiries = true
    )
  );

CREATE POLICY suppliers_access ON suppliers
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY appointments_access ON appointments
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_scheduling = true
    )
  );

CREATE POLICY labour_rates_access ON labour_rates
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_settings = true
    )
  );

CREATE POLICY payment_methods_access ON payment_methods
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY price_list_items_access ON price_list_items
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY tax_rates_access ON tax_rates
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_settings = true
    )
  );

CREATE POLICY timesheets_access ON timesheets
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_timesheets = true
    )
  );

CREATE POLICY staff_access ON staff
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_staff_members = true
    )
  );

CREATE POLICY business_settings_access ON business_settings
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_businesses 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND can_access_settings = true
    )
  );


-- 8. UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_businesses_updated_at
  BEFORE UPDATE ON user_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Created businesses table
-- ✅ Created user_businesses junction table with permissions
-- ✅ Added business_id to all data tables
-- ✅ Migrated existing user data to businesses (1 business per user)
-- ✅ Made business_id NOT NULL
-- ✅ Created helper functions for permissions
-- ✅ Enabled RLS with business-scoped policies
-- ✅ Added updated_at triggers
--
-- Next steps:
-- 1. Update application code to use business_id instead of user_id
-- 2. Implement permission checks in UI
-- 3. Add business creation flow for new signups
-- 4. Add team invitation system
-- =====================================================
