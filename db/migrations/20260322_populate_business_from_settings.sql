-- =====================================================
-- POPULATE BUSINESSES FROM BUSINESS_SETTINGS
-- Date: March 22, 2026
-- Purpose: Copy existing business data from business_settings to businesses table
-- =====================================================

-- IMPORTANT: Temporarily disable RLS to access data in migration context
-- (SQL Editor runs without auth.uid() so RLS blocks everything)
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE labour_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 1. POPULATE BUSINESSES TABLE FROM BUSINESS_SETTINGS
-- =====================================================
DO $$
DECLARE
  settings_record RECORD;
  new_business_id UUID;
  current_user_id UUID;
  settings_count INTEGER;
BEGIN
  -- Check if we have any business_settings
  SELECT COUNT(*) INTO settings_count FROM business_settings;
  RAISE NOTICE '=== Found % business_settings records ===', settings_count;
  
  IF settings_count = 0 THEN
    RAISE EXCEPTION 'No business_settings records found! Cannot migrate.';
  END IF;
  
  -- Get the first business_settings record (you said only 1 business)
  SELECT * INTO settings_record
  FROM business_settings
  LIMIT 1;
  
  -- We already confirmed count > 0, so if settings_record is null, something is wrong
  IF settings_record.id IS NULL THEN
    RAISE EXCEPTION 'Could not retrieve business_settings record even though count shows records exist. Check RLS policies.';
  END IF;
  
  RAISE NOTICE 'Business settings found for user: %', settings_record.user_id;
  RAISE NOTICE 'Company name: %', settings_record.company_name;
  
  -- Create business from settings data
    INSERT INTO businesses (
      name,
      trading_name,
      abn,
      acn,
      phone,
      email,
      website,
      address,
      city,
      state,
      postcode,
      country,
      logo_url,
      default_tax_rate,
      currency,
      timezone,
      subscription_plan,
      subscription_status,
      created_at,
      updated_at
    ) VALUES (
      COALESCE(settings_record.company_name, 'My Business'), -- name (required)
      settings_record.trading_name,
      settings_record.abn,
      NULL, -- acn (not in business_settings)
      COALESCE(settings_record.company_phone, settings_record.company_mobile), -- phone
      settings_record.company_email,
      settings_record.company_website,
      settings_record.street_address, -- address
      settings_record.suburb, -- city
      settings_record.state,
      settings_record.postcode,
      'Australia',
      settings_record.company_logo_url,
      COALESCE(settings_record.default_tax_rate, 10.00),
      COALESCE(settings_record.currency, 'AUD'),
      COALESCE(settings_record.timezone, 'Australia/Sydney'),
      'free', -- subscription_plan
      'active', -- subscription_status
      COALESCE(settings_record.created_at, NOW()),
      COALESCE(settings_record.updated_at, NOW())
    ) RETURNING id INTO new_business_id;
    
    RAISE NOTICE 'Created business with ID: %', new_business_id;
    
    -- Get the user_id from settings
    current_user_id := settings_record.user_id;
    
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
      current_user_id,
      new_business_id,
      'owner',
      true, true, true, true, true, true, true, true, true, true, true, true,
      NOW()
    );
    
    RAISE NOTICE 'Linked user % to business %', current_user_id, new_business_id;
    
    -- 2. UPDATE ALL TABLES WITH THE BUSINESS_ID
    -- =====================================================
    
    -- Update business_settings itself
    UPDATE business_settings 
    SET business_id = new_business_id 
    WHERE id = settings_record.id;
    
    -- Update core tables
    UPDATE clients 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE jobs 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE quotes 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE invoices 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE purchase_orders 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE enquiries 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE suppliers 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    -- Update optional tables if they have data
    UPDATE appointments 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE labour_rates 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE payment_methods 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE price_list_items 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE tax_rates 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE timesheets 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    UPDATE staff 
    SET business_id = new_business_id 
    WHERE user_id = current_user_id AND business_id IS NULL;
    
    RAISE NOTICE 'Updated all tables with business_id: %', new_business_id;
    RAISE NOTICE '=== Migration complete! ✅ ===';
END $$;

-- Re-enable RLS on all tables
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
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


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check the results

SELECT 'Businesses created' as check_type, COUNT(*) as count FROM businesses;

SELECT 'User-business links' as check_type, COUNT(*) as count FROM user_businesses;

SELECT 'Clients with business_id' as check_type, COUNT(*) as count FROM clients WHERE business_id IS NOT NULL;

SELECT 'Jobs with business_id' as check_type, COUNT(*) as count FROM jobs WHERE business_id IS NOT NULL;

SELECT 'Quotes with business_id' as check_type, COUNT(*) as count FROM quotes WHERE business_id IS NOT NULL;

SELECT 'Invoices with business_id' as check_type, COUNT(*) as count FROM invoices WHERE business_id IS NOT NULL;

-- Show the actual business created
SELECT 
  id,
  name,
  trading_name,
  abn,
  email,
  phone,
  address,
  city,
  state,
  created_at
FROM businesses;
