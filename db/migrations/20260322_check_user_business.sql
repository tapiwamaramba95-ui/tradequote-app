-- Diagnostic query to check user_businesses table
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check current auth user
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 2. Check all user_businesses records
SELECT 
    ub.id,
    ub.user_id,
    ub.business_id,
    ub.role,
    ub.is_active,
    b.name as business_name
FROM user_businesses ub
LEFT JOIN businesses b ON b.id = ub.business_id
ORDER BY ub.created_at DESC;

-- 3. Check if current user has a business
SELECT 
    ub.id,
    ub.user_id,
    ub.business_id,
    ub.role,
    ub.is_active,
    b.name as business_name
FROM user_businesses ub
LEFT JOIN businesses b ON b.id = ub.business_id
WHERE ub.user_id = auth.uid();

-- 4. Check business_settings to see what user_id is there
SELECT 
    id,
    user_id,
    company_name,
    created_at
FROM business_settings
ORDER BY created_at DESC;

-- 5. Count records
SELECT 
    (SELECT COUNT(*) FROM businesses) as businesses_count,
    (SELECT COUNT(*) FROM user_businesses) as user_businesses_count,
    (SELECT COUNT(*) FROM business_settings) as business_settings_count;
