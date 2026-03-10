-- Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- Company Info
  company_name TEXT,
  abn TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_logo_url TEXT,
  
  -- Bank Details
  bank_name TEXT,
  bsb TEXT,
  account_number TEXT,
  account_name TEXT,
  
  -- Invoice Settings
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1,
  invoice_terms TEXT DEFAULT 'Payment due within 30 days',
  invoice_footer TEXT,
  show_logo_on_invoice BOOLEAN DEFAULT true,
  
  -- Quote Settings
  quote_prefix TEXT DEFAULT 'Q',
  quote_start_number INTEGER DEFAULT 1,
  quote_validity_days INTEGER DEFAULT 30,
  
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
  
  -- Timesheet Settings
  require_photo_on_clockin BOOLEAN DEFAULT false,
  allow_manual_time_entry BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Labour Rates
CREATE TABLE IF NOT EXISTS labour_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role_name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  method_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Price List
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS business_settings_user_id_idx ON business_settings(user_id);
CREATE INDEX IF NOT EXISTS labour_rates_user_id_idx ON labour_rates(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS price_list_user_id_idx ON price_list_items(user_id);

-- RLS Policies
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON business_settings;
CREATE POLICY "Users manage own settings" ON business_settings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own labour_rates" ON labour_rates;
CREATE POLICY "Users manage own labour_rates" ON labour_rates FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own payment_methods" ON payment_methods;
CREATE POLICY "Users manage own payment_methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own price_list" ON price_list_items;
CREATE POLICY "Users manage own price_list" ON price_list_items FOR ALL USING (auth.uid() = user_id);

-- Default data function
CREATE OR REPLACE FUNCTION create_default_business_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_settings (user_id) VALUES (NEW.id);
  
  INSERT INTO payment_methods (user_id, method_name, sort_order)
  VALUES 
    (NEW.id, 'Cash', 1),
    (NEW.id, 'Bank Transfer', 2),
    (NEW.id, 'Credit Card', 3);
  
  INSERT INTO labour_rates (user_id, role_name, hourly_rate, description)
  VALUES 
    (NEW.id, 'Apprentice', 45.00, 'Apprentice tradesperson'),
    (NEW.id, 'Tradesperson', 85.00, 'Qualified tradesperson'),
    (NEW.id, 'Supervisor', 110.00, 'Senior supervisor');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_business_settings_trigger ON profiles;
CREATE TRIGGER create_business_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_business_settings();
