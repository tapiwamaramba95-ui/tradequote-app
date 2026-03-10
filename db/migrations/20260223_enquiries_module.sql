-- =====================================================
-- ENQUIRIES MODULE
-- Website forms + Email ingestion system
-- =====================================================

-- =====================================================
-- ENQUIRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Customer Info (from form/email)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- Enquiry Details
  description TEXT,
  job_type TEXT, -- e.g., "Plumbing", "Electrical", "General"
  preferred_date DATE,
  
  -- Source Tracking
  source TEXT DEFAULT 'web_form', -- 'web_form', 'email', 'manual'
  source_details JSONB, -- Store original email data if from email
  
  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'quoted', 'converted', 'rejected'
  
  -- Conversion Tracking
  converted_to_job_id UUID REFERENCES jobs(id),
  converted_to_quote_id UUID REFERENCES quotes(id),
  converted_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT, -- Private notes, not shown to customer
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ENQUIRY SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enquiry_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  
  -- Public Profile
  public_profile_name TEXT UNIQUE, -- Used in URL: tradequote.com/{public_profile_name}/enquire
  company_logo_url TEXT,
  
  -- Form Customization
  form_enabled BOOLEAN DEFAULT true,
  form_fields JSONB DEFAULT '["name","email","phone","address","description","preferred_date"]'::jsonb,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  
  -- Email Integration (Future Phase 2)
  email_enabled BOOLEAN DEFAULT false,
  enquiry_email TEXT UNIQUE, -- e.g., businessname@enquiries.tradequote.com
  sendgrid_webhook_secret TEXT, -- For webhook validation
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries(status);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS enquiry_settings_user_id_idx ON enquiry_settings(user_id);
CREATE INDEX IF NOT EXISTS enquiry_settings_public_profile_idx ON enquiry_settings(public_profile_name);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own enquiries" ON enquiries;
CREATE POLICY "Users manage own enquiries" ON enquiries FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own enquiry_settings" ON enquiry_settings;
CREATE POLICY "Users manage own enquiry_settings" ON enquiry_settings FOR ALL USING (auth.uid() = user_id);

-- Public access to view enquiry settings for forms (no auth required)
DROP POLICY IF EXISTS "Public can view enquiry settings for forms" ON enquiry_settings;
CREATE POLICY "Public can view enquiry settings for forms" 
  ON enquiry_settings FOR SELECT 
  USING (form_enabled = true);

-- Public access to insert enquiries from web forms (no auth required)
DROP POLICY IF EXISTS "Public can submit enquiries via forms" ON enquiries;
CREATE POLICY "Public can submit enquiries via forms"
  ON enquiries FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- DEFAULT SETTINGS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_enquiry_settings()
RETURNS TRIGGER AS $$
DECLARE
  base_name TEXT;
  counter INT := 0;
  unique_name TEXT;
  name_exists BOOLEAN;
BEGIN
  -- Generate base name from email (remove special chars, lowercase)
  base_name := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'));
  unique_name := base_name;
  
  -- Ensure uniqueness by adding counter if needed
  LOOP
    SELECT EXISTS(SELECT 1 FROM enquiry_settings WHERE public_profile_name = unique_name) INTO name_exists;
    EXIT WHEN NOT name_exists;
    counter := counter + 1;
    unique_name := base_name || counter::TEXT;
  END LOOP;
  
  -- Insert default settings
  INSERT INTO enquiry_settings (user_id, public_profile_name, enquiry_email)
  VALUES (
    NEW.id,
    unique_name,
    unique_name || '@enquiries.tradequote.com'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_enquiry_settings_trigger ON profiles;
CREATE TRIGGER create_enquiry_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_enquiry_settings();

-- =====================================================
-- Updated timestamp trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_enquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enquiries_updated_at ON enquiries;
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_enquiry_updated_at();

DROP TRIGGER IF EXISTS update_enquiry_settings_updated_at ON enquiry_settings;
CREATE TRIGGER update_enquiry_settings_updated_at
  BEFORE UPDATE ON enquiry_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_enquiry_updated_at();
