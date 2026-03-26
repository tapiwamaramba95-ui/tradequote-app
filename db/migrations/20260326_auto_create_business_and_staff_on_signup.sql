-- =====================================================
-- AUTO-CREATE BUSINESS AND STAFF ON NEW USER SIGNUP
-- Date: March 26, 2026
-- Purpose: Automatically create business, user_business, and staff records when a user signs up
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_business_setup()
RETURNS TRIGGER AS $$
DECLARE
  new_business_id UUID;
  user_profile RECORD;
BEGIN
  -- Get user profile info (email, name, business name)
  SELECT id, email, full_name, business_name, company_name
  INTO user_profile
  FROM public.profiles 
  WHERE id = NEW.id;
  
  -- If profile doesn't exist yet, wait for it to be created by handle_new_user trigger
  IF user_profile IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a business
  IF EXISTS (SELECT 1 FROM user_businesses WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Step 1: Create a business for the new user using their provided business name
  INSERT INTO businesses (
    name,
    email,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    created_at
  ) VALUES (
    COALESCE(user_profile.business_name, user_profile.company_name, 'My Business'),
    user_profile.email,
    'free',
    'trialing',
    NOW() + INTERVAL '14 days',
    NOW()
  )
  RETURNING id INTO new_business_id;
  
  -- Step 2: Link user to their business as owner
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
    is_active,
    joined_at,
    created_at
  ) VALUES (
    NEW.id,
    new_business_id,
    'owner',
    true, -- can_access_timesheets
    true, -- can_access_jobs
    true, -- can_access_invoicing
    true, -- can_access_quoting
    true, -- can_access_purchases
    true, -- can_access_reports
    true, -- can_access_scheduling
    true, -- can_access_enquiries
    true, -- can_access_staff_tracking
    true, -- can_access_settings
    true, -- can_access_staff_members
    true, -- can_access_billing
    true, -- is_active
    NOW(), -- joined_at
    NOW()  -- created_at
  );
  
  -- Step 3: Create staff member for the owner with their profile information
  INSERT INTO staff (
    user_id,
    owner_id,
    business_id,
    name,
    email,
    role,
    is_active,
    created_at
  ) VALUES (
    NEW.id,
    NEW.id, -- Owner is staff member of their own business
    new_business_id,
    user_profile.full_name,
    user_profile.email,
    'Owner',
    true,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_business_setup ON auth.users;

-- Create trigger to run AFTER profile is created
-- This trigger runs after handle_new_user creates the profile
CREATE TRIGGER on_auth_user_business_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_business_setup();

-- Add a comment
COMMENT ON FUNCTION public.handle_new_user_business_setup() IS 
'Automatically creates a business, user_business relationship, and staff member for new users on signup.';
