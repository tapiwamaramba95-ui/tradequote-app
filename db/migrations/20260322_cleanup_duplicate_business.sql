-- Cleanup duplicate business records
-- This removes the duplicate business created by running the migration twice
-- Keeps the original "APM Maintance" business

DO $$
DECLARE
  duplicate_business_id UUID;
  correct_business_id UUID;
  target_user_id UUID := '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
BEGIN
  -- Find the correct business (from business_settings)
  SELECT id INTO correct_business_id
  FROM businesses
  WHERE name = 'APM Maintance'
  LIMIT 1;

  -- Find the duplicate business (the one NOT from business_settings)
  SELECT id INTO duplicate_business_id
  FROM businesses
  WHERE name LIKE 'Business %'
    AND id != correct_business_id
  LIMIT 1;

  RAISE NOTICE 'Correct business ID: %', correct_business_id;
  RAISE NOTICE 'Duplicate business ID: %', duplicate_business_id;

  IF duplicate_business_id IS NOT NULL THEN
    -- Delete the duplicate user_businesses record
    DELETE FROM user_businesses
    WHERE business_id = duplicate_business_id;
    
    RAISE NOTICE 'Deleted user_businesses record for duplicate business';

    -- Delete the duplicate business
    DELETE FROM businesses
    WHERE id = duplicate_business_id;
    
    RAISE NOTICE 'Deleted duplicate business: %', duplicate_business_id;
  END IF;

  -- Verify we now have exactly 1 business and 1 user_businesses record
  RAISE NOTICE 'Final counts:';
  RAISE NOTICE '  Businesses: %', (SELECT COUNT(*) FROM businesses);
  RAISE NOTICE '  User businesses: %', (SELECT COUNT(*) FROM user_businesses WHERE user_id = target_user_id);
  
END $$;

-- Verify the cleanup
SELECT 
  'Businesses' as table_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names
FROM businesses
UNION ALL
SELECT 
  'User Businesses' as table_name,
  COUNT(*) as count,
  STRING_AGG(role::text, ', ') as names
FROM user_businesses;
