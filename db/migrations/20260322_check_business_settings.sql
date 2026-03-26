-- =====================================================
-- DIAGNOSTIC: Check business_settings data
-- =====================================================

-- Check if table exists and has data (bypassing RLS if needed)
SELECT 
  'business_settings table structure' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'business_settings'
ORDER BY ordinal_position;

-- Count total rows (may be blocked by RLS)
SELECT 'Total rows in business_settings' as info, COUNT(*) as count 
FROM business_settings;

-- Try to get data (may be blocked by RLS)
SELECT 
  'Sample business_settings data' as info,
  id,
  user_id,
  company_name,
  abn,
  company_email,
  company_phone
FROM business_settings
LIMIT 5;
