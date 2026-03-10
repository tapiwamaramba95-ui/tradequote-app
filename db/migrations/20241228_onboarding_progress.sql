-- Migration: Create onboarding_progress table
-- Purpose: Track user progress through the onboarding process
-- Date: Current timestamp

-- Create onboarding_progress table
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completion_date TIMESTAMPTZ,
    
    UNIQUE(user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view/edit their own progress
CREATE POLICY "Users can manage their own onboarding progress" 
ON onboarding_progress 
FOR ALL 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboarding_progress_updated_at 
    BEFORE UPDATE ON onboarding_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create onboarding progress on user registration
CREATE OR REPLACE FUNCTION handle_new_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO onboarding_progress (user_id, account_created)
    VALUES (NEW.id, true);
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to automatically create onboarding progress for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_onboarding();

-- Function to update progress based on other table changes
CREATE OR REPLACE FUNCTION update_onboarding_progress(
    p_user_id UUID,
    p_step_name TEXT,
    p_completed BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO onboarding_progress (user_id, account_created)
    VALUES (p_user_id, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    CASE p_step_name
        WHEN 'business_details' THEN
            UPDATE onboarding_progress 
            SET business_details_added = p_completed 
            WHERE user_id = p_user_id;
        WHEN 'company_profile' THEN
            UPDATE onboarding_progress 
            SET company_profile_completed = p_completed 
            WHERE user_id = p_user_id;
        WHEN 'invoice_settings' THEN
            UPDATE onboarding_progress 
            SET invoice_settings_completed = p_completed 
            WHERE user_id = p_user_id;
        WHEN 'first_quote' THEN
            UPDATE onboarding_progress 
            SET first_quote_created = p_completed 
            WHERE user_id = p_user_id;
    END CASE;
    
    -- Check if all steps are completed and set completion date
    UPDATE onboarding_progress 
    SET completion_date = CASE 
        WHEN business_details_added AND 
             company_profile_completed AND 
             invoice_settings_completed AND 
             first_quote_created 
        THEN COALESCE(completion_date, now())
        ELSE NULL 
    END
    WHERE user_id = p_user_id;
END;
$$ language 'plpgsql' security definer;

-- Auto-update progress based on user_profiles changes
CREATE OR REPLACE FUNCTION handle_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check business details completion
    IF NEW.business_name IS NOT NULL AND NEW.business_name != '' THEN
        PERFORM update_onboarding_progress(NEW.id, 'business_details', true);
    END IF;
    
    -- Check company profile completion
    IF NEW.abn IS NOT NULL AND NEW.abn != '' AND 
       NEW.business_address IS NOT NULL AND NEW.business_address != '' THEN
        PERFORM update_onboarding_progress(NEW.id, 'company_profile', true);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

CREATE TRIGGER on_user_profiles_update
    AFTER UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_user_profile_update();

-- Auto-update progress based on quotes creation
CREATE OR REPLACE FUNCTION handle_quote_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_onboarding_progress(NEW.user_id, 'first_quote', true);
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

CREATE TRIGGER on_quote_created
    AFTER INSERT ON quotes
    FOR EACH ROW EXECUTE FUNCTION handle_quote_created();

-- Initialize progress for existing users
INSERT INTO onboarding_progress (user_id, account_created, business_details_added, company_profile_completed)
SELECT 
    id as user_id,
    true as account_created,
    CASE WHEN business_name IS NOT NULL AND business_name != '' THEN true ELSE false END as business_details_added,
    CASE WHEN abn IS NOT NULL AND abn != '' AND business_address IS NOT NULL AND business_address != '' THEN true ELSE false END as company_profile_completed
FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;