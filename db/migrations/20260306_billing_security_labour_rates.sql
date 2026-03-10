-- =====================================================
-- BILLING & PAYMENTS MODULE
-- Created: 2026-03-06
-- =====================================================

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  stripe_payment_method_id TEXT NOT NULL,
  
  -- Card details
  card_brand TEXT, -- 'visa', 'mastercard', 'amex'
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- BILLING HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'
  
  billing_period_start DATE,
  billing_period_end DATE,
  
  invoice_pdf_url TEXT,
  
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SECURITY MODULE
-- =====================================================

-- Add to profiles table for 2FA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- =====================================================
-- SECURITY AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  -- 'password_changed', 'password_reset_requested', 
  -- '2fa_enabled', '2fa_disabled', 'login_success', 'login_failed'
  
  ip_address TEXT,
  user_agent TEXT,
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LABOUR RATES MODULE
-- =====================================================

-- =====================================================
-- LABOUR RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS labour_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  rate_name TEXT NOT NULL,
  rate_type TEXT NOT NULL,
  
  hourly_rate DECIMAL(10,2) NOT NULL,
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure columns exist (in case table was created elsewhere)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='labour_rates' AND column_name='rate_type') THEN
    ALTER TABLE labour_rates ADD COLUMN rate_type TEXT NOT NULL DEFAULT 'standard';
  END IF;
END $$;

-- =====================================================
-- STAFF LABOUR RATES (Optional - for different rates per staff member)
-- =====================================================
-- Only create if staff table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='staff') THEN
    CREATE TABLE IF NOT EXISTS staff_labour_rates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
      labour_rate_id UUID REFERENCES labour_rates(id) ON DELETE CASCADE,
      
      custom_hourly_rate DECIMAL(10,2),
      
      created_at TIMESTAMP DEFAULT NOW()
    );
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================

-- Payment Methods
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);

-- Billing History
CREATE INDEX IF NOT EXISTS billing_history_user_id_idx ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS billing_history_created_at_idx ON billing_history(created_at DESC);

-- Security Audit Log
CREATE INDEX IF NOT EXISTS security_audit_log_user_id_idx ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS security_audit_log_created_at_idx ON security_audit_log(created_at DESC);

-- Labour Rates
CREATE INDEX IF NOT EXISTS labour_rates_user_id_idx ON labour_rates(user_id);
CREATE INDEX IF NOT EXISTS labour_rates_rate_type_idx ON labour_rates(rate_type);

-- Staff Labour Rates (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='staff_labour_rates') THEN
    CREATE INDEX IF NOT EXISTS staff_labour_rates_staff_id_idx ON staff_labour_rates(staff_id);
    CREATE INDEX IF NOT EXISTS staff_labour_rates_labour_rate_id_idx ON staff_labour_rates(labour_rate_id);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payment_methods" ON payment_methods;
CREATE POLICY "Users manage own payment_methods" ON payment_methods
  FOR ALL USING (user_id = auth.uid());

-- Billing History
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own billing_history" ON billing_history;
CREATE POLICY "Users view own billing_history" ON billing_history
  FOR SELECT USING (user_id = auth.uid());

-- Security Audit Log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own security_audit_log" ON security_audit_log;
CREATE POLICY "Users view own security_audit_log" ON security_audit_log
  FOR SELECT USING (user_id = auth.uid());

-- Labour Rates
ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own labour_rates" ON labour_rates;
CREATE POLICY "Users manage own labour_rates" ON labour_rates
  FOR ALL USING (user_id = auth.uid());

-- Staff Labour Rates (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='staff_labour_rates') THEN
    ALTER TABLE staff_labour_rates ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users manage own staff_labour_rates" ON staff_labour_rates;
    CREATE POLICY "Users manage own staff_labour_rates" ON staff_labour_rates
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM staff
          WHERE staff.id = staff_labour_rates.staff_id
          AND staff.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- SUBSCRIPTION FIELDS FOR PROFILES
-- =====================================================

-- Add subscription-related columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'; -- 'trial', 'active', 'cancelled', 'expired'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'starter'; -- 'starter', 'professional', 'business'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly'; -- 'monthly', 'yearly'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
