-- =====================================================
-- SETTINGS TABLES - COMPREHENSIVE SETUP
-- =====================================================
-- This creates all settings-related tables for the application
-- Run this in your Supabase SQL Editor

-- =====================================================
-- BUSINESS SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- Company Info
  company_name TEXT,
  abn TEXT,
  trading_name TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_mobile TEXT,
  company_website TEXT,
  company_licence_number TEXT,
  gst_registered BOOLEAN DEFAULT false,
  
  -- Company Address
  street_address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  
  -- Branding
  company_logo_url TEXT,
  primary_brand_color TEXT DEFAULT '#ea580c',
  
  -- Bank Details
  bank_name TEXT,
  bsb TEXT,
  account_number TEXT,
  account_name TEXT,
  
  -- Tax Settings
  default_tax_rate DECIMAL(5,2) DEFAULT 10.00,
  tax_name TEXT DEFAULT 'GST',
  tax_number TEXT,
  is_tax_registered BOOLEAN DEFAULT true,
  
  -- Regional Settings
  currency TEXT DEFAULT 'AUD',
  
  -- Invoice Settings
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1,
  invoice_terms TEXT DEFAULT 'Payment due within 30 days',
  invoice_footer TEXT,
  show_logo_on_invoice BOOLEAN DEFAULT true,
  invoice_notes TEXT,
  
  -- Quote Settings
  quote_prefix TEXT DEFAULT 'Q',
  quote_start_number INTEGER DEFAULT 1,
  quote_validity_days INTEGER DEFAULT 30,
  quote_terms TEXT,
  quote_notes TEXT,
  
  -- Job Settings
  job_prefix TEXT DEFAULT 'J',
  job_start_number INTEGER DEFAULT 1,
  
  -- PO Settings
  po_prefix TEXT DEFAULT 'PO',
  po_start_number INTEGER DEFAULT 1,
  default_markup_percentage DECIMAL(5,2) DEFAULT 20.00,
  
  -- Scheduler Settings
  work_day_start TIME DEFAULT '08:00',
  work_day_end TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'Australia/Sydney',
  
  -- Timesheet Settings
  require_photo_on_clockin BOOLEAN DEFAULT false,
  allow_manual_time_entry BOOLEAN DEFAULT true,
  
  -- Email Settings
  send_quote_emails BOOLEAN DEFAULT true,
  send_invoice_emails BOOLEAN DEFAULT true,
  email_signature TEXT,
  
  -- Notification Settings
  notify_new_enquiries BOOLEAN DEFAULT true,
  notify_quote_viewed BOOLEAN DEFAULT true,
  notify_quote_accepted BOOLEAN DEFAULT true,
  notify_invoice_paid BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing business_settings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'user_id') THEN
    ALTER TABLE business_settings ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'trading_name') THEN
    ALTER TABLE business_settings ADD COLUMN trading_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'company_mobile') THEN
    ALTER TABLE business_settings ADD COLUMN company_mobile TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'company_website') THEN
    ALTER TABLE business_settings ADD COLUMN company_website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'company_licence_number') THEN
    ALTER TABLE business_settings ADD COLUMN company_licence_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'gst_registered') THEN
    ALTER TABLE business_settings ADD COLUMN gst_registered BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'street_address') THEN
    ALTER TABLE business_settings ADD COLUMN street_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'suburb') THEN
    ALTER TABLE business_settings ADD COLUMN suburb TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'state') THEN
    ALTER TABLE business_settings ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'postcode') THEN
    ALTER TABLE business_settings ADD COLUMN postcode TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'primary_brand_color') THEN
    ALTER TABLE business_settings ADD COLUMN primary_brand_color TEXT DEFAULT '#ea580c';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'default_tax_rate') THEN
    ALTER TABLE business_settings ADD COLUMN default_tax_rate DECIMAL(5,2) DEFAULT 10.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'tax_name') THEN
    ALTER TABLE business_settings ADD COLUMN tax_name TEXT DEFAULT 'GST';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'tax_number') THEN
    ALTER TABLE business_settings ADD COLUMN tax_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'is_tax_registered') THEN
    ALTER TABLE business_settings ADD COLUMN is_tax_registered BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'currency') THEN
    ALTER TABLE business_settings ADD COLUMN currency TEXT DEFAULT 'AUD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'timezone') THEN
    ALTER TABLE business_settings ADD COLUMN timezone TEXT DEFAULT 'Australia/Sydney';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'email_signature') THEN
    ALTER TABLE business_settings ADD COLUMN email_signature TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'invoice_notes') THEN
    ALTER TABLE business_settings ADD COLUMN invoice_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'quote_notes') THEN
    ALTER TABLE business_settings ADD COLUMN quote_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'quote_terms') THEN
    ALTER TABLE business_settings ADD COLUMN quote_terms TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'send_quote_emails') THEN
    ALTER TABLE business_settings ADD COLUMN send_quote_emails BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'send_invoice_emails') THEN
    ALTER TABLE business_settings ADD COLUMN send_invoice_emails BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'notify_new_enquiries') THEN
    ALTER TABLE business_settings ADD COLUMN notify_new_enquiries BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'notify_quote_viewed') THEN
    ALTER TABLE business_settings ADD COLUMN notify_quote_viewed BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'notify_quote_accepted') THEN
    ALTER TABLE business_settings ADD COLUMN notify_quote_accepted BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'notify_invoice_paid') THEN
    ALTER TABLE business_settings ADD COLUMN notify_invoice_paid BOOLEAN DEFAULT true;
  END IF;
END $$;

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON business_settings;
CREATE POLICY "Users manage own settings" ON business_settings FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS business_settings_user_id_idx ON business_settings(user_id);

-- =====================================================
-- LABOUR RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS labour_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role_name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'labour_rates' AND column_name = 'user_id') THEN
    ALTER TABLE labour_rates ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own labour_rates" ON labour_rates;
CREATE POLICY "Users manage own labour_rates" ON labour_rates FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS labour_rates_user_id_idx ON labour_rates(user_id);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  method_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'user_id') THEN
    ALTER TABLE payment_methods ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payment_methods" ON payment_methods;
CREATE POLICY "Users manage own payment_methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);

-- =====================================================
-- PRICE LIST ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  item_code TEXT,
  item_name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT DEFAULT 'each',
  cost_price DECIMAL(10,2),
  markup_percentage DECIMAL(5,2),
  sell_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_list_items' AND column_name = 'user_id') THEN
    ALTER TABLE price_list_items ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own price_list" ON price_list_items;
CREATE POLICY "Users manage own price_list" ON price_list_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS price_list_user_id_idx ON price_list_items(user_id);

-- =====================================================
-- TAX RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tax_rates' AND column_name = 'user_id') THEN
    ALTER TABLE tax_rates ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tax_rates" ON tax_rates;
CREATE POLICY "Users manage own tax_rates" ON tax_rates FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tax_rates_user_id_idx ON tax_rates(user_id);

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- Display Preferences
  theme TEXT DEFAULT 'light',
  items_per_page INTEGER DEFAULT 50,
  default_dashboard_view TEXT DEFAULT 'summary',
  
  -- Date & Time
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h',
  timezone TEXT DEFAULT 'Australia/Sydney',
  
  -- Regional
  currency TEXT DEFAULT 'AUD',
  currency_symbol TEXT DEFAULT '$',
  number_format TEXT DEFAULT 'en-AU',
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'user_id') THEN
    ALTER TABLE user_preferences ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- =====================================================
-- TWO-FACTOR AUTHENTICATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- 2FA Status
  is_enabled BOOLEAN DEFAULT false,
  method TEXT DEFAULT 'totp', -- totp, sms, email
  
  -- TOTP Settings
  totp_secret TEXT,
  totp_verified_at TIMESTAMP,
  
  -- Backup & Recovery
  backup_codes TEXT[], -- Encrypted backup codes
  recovery_email TEXT,
  recovery_phone TEXT,
  
  -- Usage Tracking
  last_used_at TIMESTAMP,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_auth' AND column_name = 'user_id') THEN
    ALTER TABLE two_factor_auth ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own 2FA" ON two_factor_auth;
CREATE POLICY "Users manage own 2FA" ON two_factor_auth FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS two_factor_auth_user_id_idx ON two_factor_auth(user_id);

-- =====================================================
-- DEFAULT DATA CREATION TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create business settings with defaults
  INSERT INTO business_settings (user_id, company_name)
  VALUES (NEW.id, COALESCE(NEW.company_name, 'My Business'))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user preferences with defaults
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create 2FA record (disabled by default)
  INSERT INTO two_factor_auth (user_id, is_enabled)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default payment methods
  INSERT INTO payment_methods (user_id, method_name, sort_order)
  VALUES 
    (NEW.id, 'Cash', 1),
    (NEW.id, 'Bank Transfer', 2),
    (NEW.id, 'Credit Card', 3),
    (NEW.id, 'Direct Debit', 4)
  ON CONFLICT DO NOTHING;
  
  -- Create default labour rates
  INSERT INTO labour_rates (user_id, role_name, hourly_rate, description)
  VALUES 
    (NEW.id, 'Apprentice', 45.00, 'Apprentice tradesperson'),
    (NEW.id, 'Tradesperson', 85.00, 'Qualified tradesperson'),
    (NEW.id, 'Senior Tradesperson', 95.00, 'Senior tradesperson'),
    (NEW.id, 'Supervisor', 110.00, 'Site supervisor')
  ON CONFLICT DO NOTHING;
  
  -- Create default tax rates
  INSERT INTO tax_rates (user_id, tax_name, tax_rate, is_default, is_active)
  VALUES 
    (NEW.id, 'GST', 10.00, true, true),
    (NEW.id, 'No GST', 0.00, false, true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS create_user_settings_trigger ON profiles;
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked

-- Check business_settings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_settings' 
ORDER BY ordinal_position;

-- Check labour_rates table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'labour_rates' 
ORDER BY ordinal_position;

-- Check payment_methods table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_methods' 
ORDER BY ordinal_position;

-- Check price_list_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'price_list_items' 
ORDER BY ordinal_position;

-- Check tax_rates table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tax_rates' 
ORDER BY ordinal_position;

-- Check user_preferences table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
ORDER BY ordinal_position;

-- Check two_factor_auth table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'two_factor_auth' 
ORDER BY ordinal_position;
