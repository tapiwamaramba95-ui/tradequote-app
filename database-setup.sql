-- =====================================================
-- SUPABASE DATABASE SETUP FOR SIGN-UP FUNCTIONALITY  
-- =====================================================
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- This will create/update the tables needed for sign-up
-- UPDATED: Fixed RLS policies for trigger function compatibility

-- =====================================================
-- 1. PROFILES TABLE - Complete Setup
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    business_name TEXT,
    trade_type TEXT,
    phone TEXT,
    subscription_status TEXT DEFAULT 'trial',
    trial_started_at TIMESTAMPTZ,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check and add business_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'business_name') THEN
        ALTER TABLE profiles ADD COLUMN business_name TEXT;
        RAISE NOTICE 'Added business_name column to profiles';
    END IF;

    -- Check and add trade_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'trade_type') THEN
        ALTER TABLE profiles ADD COLUMN trade_type TEXT;
        RAISE NOTICE 'Added trade_type column to profiles';
    END IF;

    -- Check and add phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles';
    END IF;

    -- Check and add subscription_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
        RAISE NOTICE 'Added subscription_status column to profiles';
    END IF;

    -- Check and add trial_started_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'trial_started_at') THEN
        ALTER TABLE profiles ADD COLUMN trial_started_at TIMESTAMPTZ;
        RAISE NOTICE 'Added trial_started_at column to profiles';
    END IF;
END $$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow service role to insert profiles (for triggers)
CREATE POLICY "Service role can insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- 2. ONBOARDING_PROGRESS TABLE - Complete Setup
-- =====================================================

-- Create onboarding_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Step tracking
    account_created BOOLEAN DEFAULT true,
    business_details_added BOOLEAN DEFAULT false,
    company_profile_completed BOOLEAN DEFAULT false,
    invoice_settings_completed BOOLEAN DEFAULT false,
    first_quote_created BOOLEAN DEFAULT false,
    
    -- Widget state
    widget_dismissed BOOLEAN DEFAULT false,
    widget_dismissed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    
    UNIQUE(user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id 
ON onboarding_progress(user_id);

-- Enable RLS on onboarding_progress table  
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own onboarding progress" ON onboarding_progress;

-- RLS Policy: Users can only view/edit their own progress
CREATE POLICY "Users can manage their own onboarding progress" 
ON onboarding_progress FOR ALL 
USING (auth.uid() = user_id);

-- Allow service role to insert onboarding progress (for triggers)
CREATE POLICY "Service role can insert onboarding progress" 
ON onboarding_progress FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- 3. AUTO-CREATE PROFILE AND ONBOARDING PROGRESS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile (bypass RLS)
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email,
        TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create onboarding progress (bypass RLS) 
    INSERT INTO public.onboarding_progress (user_id, account_created)
    VALUES (NEW.id, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile and onboarding progress
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. UPDATED_AT TRIGGER FOR PROFILES
-- =====================================================

-- Create or update the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for onboarding_progress updated_at  
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check onboarding_progress table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'onboarding_progress' 
ORDER BY ordinal_position;

-- Test that RLS policies are working
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'onboarding_progress');

RAISE NOTICE '✅ Database setup complete! Your sign-up functionality should now work.';
RAISE NOTICE '📝 Next steps: Copy this SQL and run it in Supabase Dashboard > SQL Editor';