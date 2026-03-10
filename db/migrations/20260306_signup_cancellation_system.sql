-- =====================================================
-- SIGN-UP JOURNEY & CANCELLATION SYSTEM
-- =====================================================
-- Created: 2026-03-06
-- Purpose: Complete sign-up, trial management, and cancellation flow

-- =====================================================
-- UPDATE PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Subscription & Trial
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
-- 'trial', 'active', 'cancelled', 'suspended', 'deleted'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
-- 'starter', 'professional', 'business'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly';
-- 'monthly', 'yearly'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;

-- Cancellation & Deletion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_until TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_deleted_at TIMESTAMP;

-- Stripe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- =====================================================
-- CANCELLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Cancellation details
  cancelled_at TIMESTAMP DEFAULT NOW(),
  cancellation_reason TEXT,
  -- 'too_expensive', 'missing_features', 'too_complicated', 
  -- 'switching', 'no_longer_needed', 'just_trying', 'other'
  
  cancellation_feedback TEXT,
  
  -- Retention offers
  retention_offer_shown TEXT,
  -- 'discount_50_percent', 'feature_request', 'setup_call', null
  
  retention_offer_accepted BOOLEAN DEFAULT false,
  
  -- Stats at cancellation
  jobs_created INTEGER DEFAULT 0,
  quotes_created INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  
  -- Reactivation
  reactivated_at TIMESTAMP,
  reactivation_plan TEXT,
  
  -- Deletion
  data_deletion_date DATE,
  data_deleted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PAYMENT FAILURES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  failed_at TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'AUD',
  
  failure_reason TEXT,
  stripe_error_code TEXT,
  
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  
  resolved_at TIMESTAMP,
  resolution_method TEXT,
  -- 'updated_card', 'different_card', 'cancelled'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS profiles_trial_ends_at_idx ON profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS profiles_deletion_scheduled_at_idx ON profiles(deletion_scheduled_at);

CREATE INDEX IF NOT EXISTS cancellations_user_id_idx ON cancellations(user_id);
CREATE INDEX IF NOT EXISTS cancellations_cancelled_at_idx ON cancellations(cancelled_at);

CREATE INDEX IF NOT EXISTS payment_failures_user_id_idx ON payment_failures(user_id);
CREATE INDEX IF NOT EXISTS payment_failures_resolved_at_idx ON payment_failures(resolved_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cancellations" ON cancellations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users view own payment_failures" ON payment_failures
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Set trial end date on sign-up (14 days)
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_started_at IS NOT NULL AND NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at = NEW.trial_started_at + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trial_end_date_trigger ON profiles;
CREATE TRIGGER set_trial_end_date_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_end_date();

-- Calculate days remaining in trial
CREATE OR REPLACE FUNCTION days_remaining_in_trial(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end TIMESTAMP;
  days_left INTEGER;
BEGIN
  SELECT trial_ends_at INTO trial_end
  FROM profiles
  WHERE id = user_id;
  
  IF trial_end IS NULL THEN
    RETURN 0;
  END IF;
  
  days_left := EXTRACT(DAY FROM (trial_end - NOW()));
  
  RETURN GREATEST(days_left, 0);
END;
$$ LANGUAGE plpgsql;
