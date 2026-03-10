-- =====================================================
-- ONBOARDING AUTO-COMPLETE DATABASE TRIGGERS
-- =====================================================
-- Purpose: Backup triggers to auto-update onboarding progress
-- These work even if the frontend hooks fail

-- Function to check if company profile is complete
CREATE OR REPLACE FUNCTION check_company_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ABN and address exist and are filled (columns may not exist yet)  
  DECLARE
    has_required_fields BOOLEAN := false;
  BEGIN
    -- Try to check if both ABN and company_address are filled
    SELECT (
      CASE WHEN abn IS NOT NULL AND abn != '' AND company_address IS NOT NULL AND company_address != '' 
      THEN true ELSE false END
    ) INTO has_required_fields
    FROM business_settings 
    WHERE user_id = NEW.user_id 
    LIMIT 1;
    
    IF has_required_fields THEN
      UPDATE onboarding_progress
      SET company_profile_completed = true,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      RAISE NOTICE 'Company profile marked complete for user %', NEW.user_id;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      RAISE NOTICE 'ABN or company_address columns do not exist yet for user %', NEW.user_id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if invoice settings are complete
CREATE OR REPLACE FUNCTION check_invoice_settings_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if bank details are all filled (columns may not exist yet)
  DECLARE
    has_bank_details BOOLEAN := false;
  BEGIN
    SELECT (
      CASE WHEN bsb IS NOT NULL AND bsb != ''
           AND account_number IS NOT NULL AND account_number != ''
           AND account_name IS NOT NULL AND account_name != '' 
      THEN true ELSE false END
    ) INTO has_bank_details
    FROM business_settings 
    WHERE user_id = NEW.user_id 
    LIMIT 1;
    
    IF has_bank_details THEN
      UPDATE onboarding_progress
      SET invoice_settings_completed = true,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      RAISE NOTICE 'Invoice settings marked complete for user %', NEW.user_id;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      RAISE NOTICE 'Bank details columns do not exist yet for user %', NEW.user_id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check first quote completion
CREATE OR REPLACE FUNCTION check_first_quote_created()
RETURNS TRIGGER AS $$
DECLARE
  quote_count INTEGER;
BEGIN
  -- Count quotes for this user
  SELECT COUNT(*) INTO quote_count
  FROM quotes
  WHERE user_id = NEW.user_id;
  
  -- If this is the first quote, mark complete
  IF quote_count = 1 THEN
    UPDATE onboarding_progress
    SET first_quote_created = true,
        completion_date = CASE 
          WHEN completion_date IS NULL THEN NOW()
          ELSE completion_date
        END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RAISE NOTICE 'First quote marked complete for user %, total quotes: %', NEW.user_id, quote_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check business details completion (for profile updates)
CREATE OR REPLACE FUNCTION check_business_details_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- If business name and phone are filled, mark complete (trade_type may not exist yet)
  IF NEW.business_name IS NOT NULL AND NEW.business_name != ''
     AND NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    
    UPDATE onboarding_progress
    SET business_details_added = true,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RAISE NOTICE 'Business details marked complete for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize onboarding progress for new users
CREATE OR REPLACE FUNCTION init_user_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Create onboarding progress record for new user
  INSERT INTO onboarding_progress (user_id, account_created)
  VALUES (NEW.id, true)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Onboarding progress initialized for user %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for business_settings updates (company profile)  
-- Only create if business_settings table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_settings') THEN
    DROP TRIGGER IF EXISTS after_business_settings_update ON business_settings;
    CREATE TRIGGER after_business_settings_update
      AFTER UPDATE ON business_settings
      FOR EACH ROW
      EXECUTE FUNCTION check_company_profile_complete();
    
    -- Also create the invoice settings trigger since it's the same table
    DROP TRIGGER IF EXISTS after_business_settings_invoice_update ON business_settings;
    CREATE TRIGGER after_business_settings_invoice_update
      AFTER UPDATE ON business_settings
      FOR EACH ROW
      EXECUTE FUNCTION check_invoice_settings_complete();
  ELSE
    RAISE NOTICE 'business_settings table does not exist - skipping triggers';
  END IF;
END $$;

-- Trigger for quote creation
-- Only create if quotes table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
    DROP TRIGGER IF EXISTS after_quote_insert ON quotes;
    CREATE TRIGGER after_quote_insert
      AFTER INSERT ON quotes
      FOR EACH ROW
      EXECUTE FUNCTION check_first_quote_created();
  ELSE
    RAISE NOTICE 'quotes table does not exist - skipping quote trigger';
  END IF;
END $$;

-- Trigger for profile updates (business details)
-- Only create if profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS after_profile_update ON profiles;
    CREATE TRIGGER after_profile_update
      AFTER UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION check_business_details_complete();
  ELSE
    RAISE NOTICE 'profiles table does not exist - skipping profile update trigger';
  END IF;
END $$;

-- Trigger for new profile creation (usually happens right after auth.users insert)
-- Only create if profiles table exists  
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS after_profile_insert ON profiles;
    CREATE TRIGGER after_profile_insert
      AFTER INSERT ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION init_user_onboarding_progress();
  ELSE
    RAISE NOTICE 'profiles table does not exist - skipping profile insert trigger';
  END IF;
END $$;

-- Test the triggers by checking existing data
-- This will backfill any users who should already have completed steps

DO $$
DECLARE
  user_record RECORD;
  quote_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting onboarding progress backfill...';
  
  -- Check and update business details for existing users
  BEGIN
    FOR user_record IN 
      SELECT p.id, p.business_name, p.phone
      FROM profiles p
      JOIN onboarding_progress op ON op.user_id = p.id
      WHERE p.business_name IS NOT NULL AND p.business_name != ''
        AND p.phone IS NOT NULL AND p.phone != ''
        AND op.business_details_added = false
    LOOP
      UPDATE onboarding_progress
      SET business_details_added = true, updated_at = NOW()
      WHERE user_id = user_record.id;
      
      RAISE NOTICE 'Backfilled business details for user %', user_record.id;
    END LOOP;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      RAISE NOTICE 'Business details backfill skipped - profiles table or columns do not exist yet';
  END;

  -- Check and update company profile for existing users
  BEGIN
    FOR user_record IN 
      SELECT bs.user_id, bs.abn, bs.company_address
      FROM business_settings bs
      JOIN onboarding_progress op ON op.user_id = bs.user_id
      WHERE bs.abn IS NOT NULL AND bs.abn != ''
        AND bs.company_address IS NOT NULL AND bs.company_address != ''
        AND op.company_profile_completed = false
    LOOP
      UPDATE onboarding_progress
      SET company_profile_completed = true, updated_at = NOW()
      WHERE user_id = user_record.user_id;
      
      RAISE NOTICE 'Backfilled company profile for user %', user_record.user_id;
    END LOOP;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      RAISE NOTICE 'Company profile backfill skipped - business_settings table or columns do not exist yet';
  END;

  -- Check and update invoice settings for existing users
  BEGIN
    FOR user_record IN 
      SELECT bs.user_id, bs.bsb, bs.account_number, bs.account_name
      FROM business_settings bs
      JOIN onboarding_progress op ON op.user_id = bs.user_id
      WHERE bs.bsb IS NOT NULL AND bs.bsb != ''
        AND bs.account_number IS NOT NULL AND bs.account_number != ''
        AND bs.account_name IS NOT NULL AND bs.account_name != ''
        AND op.invoice_settings_completed = false
    LOOP
      UPDATE onboarding_progress
      SET invoice_settings_completed = true, updated_at = NOW()
      WHERE user_id = user_record.user_id;
      
      RAISE NOTICE 'Backfilled invoice settings for user %', user_record.user_id;
    END LOOP;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      RAISE NOTICE 'Invoice settings backfill skipped - business_settings columns do not exist yet';
  END;

  -- Check and update first quote for existing users
  BEGIN
    FOR user_record IN 
      SELECT DISTINCT q.user_id
      FROM quotes q
      JOIN onboarding_progress op ON op.user_id = q.user_id
      WHERE op.first_quote_created = false
    LOOP
      SELECT COUNT(*) INTO quote_count
      FROM quotes
      WHERE user_id = user_record.user_id;
      
      IF quote_count > 0 THEN
        UPDATE onboarding_progress
        SET first_quote_created = true, 
            completion_date = CASE 
              WHEN completion_date IS NULL THEN NOW()
              ELSE completion_date
            END,
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        RAISE NOTICE 'Backfilled first quote for user %, quote count: %', user_record.user_id, quote_count;
      END IF;
    END LOOP;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'First quote backfill skipped - quotes table does not exist yet';
  END;

  RAISE NOTICE 'Onboarding progress backfill completed!';
END $$;