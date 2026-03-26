-- =====================================================
-- ADD BUSINESS_ID TO ADDITIONAL TABLES
-- Date: March 22, 2026
-- Purpose: Complete the multi-tenancy migration by adding business_id to remaining tables
-- =====================================================

-- Note: This adds business_id to tables that were not included in the initial
-- multi-tenancy migration (20260322_add_business_multi_tenancy.sql)

-- 1. PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(business_id);

-- 2. TIMESHEET-RELATED TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_entries') THEN
    ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_timesheet_entries_business ON timesheet_entries(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'active_shifts') THEN
    ALTER TABLE active_shifts ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_active_shifts_business ON active_shifts(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_settings') THEN
    ALTER TABLE timesheet_settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_timesheet_settings_business ON timesheet_settings(business_id);
  END IF;
END $$;

-- 3. JOB-RELATED TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_appointments') THEN
    ALTER TABLE job_appointments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_job_appointments_business ON job_appointments(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_field_definitions') THEN
    ALTER TABLE custom_field_definitions ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_business ON custom_field_definitions(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_field_values') THEN
    ALTER TABLE custom_field_values ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_custom_field_values_business ON custom_field_values(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_staff') THEN
    ALTER TABLE job_staff ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_job_staff_business ON job_staff(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_contacts') THEN
    ALTER TABLE site_contacts ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_site_contacts_business ON site_contacts(business_id);
  END IF;
END $$;

-- 4. SUPPLIER/PURCHASE ORDER TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_products') THEN
    ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_supplier_products_business ON supplier_products(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
    ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_purchase_order_items_business ON purchase_order_items(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grns') THEN
    ALTER TABLE grns ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_grns_business ON grns(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    ALTER TABLE bills ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_bills_business ON bills(business_id);
  END IF;
END $$;

-- 5. SETTINGS/TEMPLATES TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'note_templates') THEN
    ALTER TABLE note_templates ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_note_templates_business ON note_templates(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enquiry_settings') THEN
    ALTER TABLE enquiry_settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_enquiry_settings_business ON enquiry_settings(business_id);
  END IF;
END $$;

-- 6. PAYMENTS AND BILLING TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_history') THEN
    ALTER TABLE billing_history ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_billing_history_business ON billing_history(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_failures') THEN
    ALTER TABLE payment_failures ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payment_failures_business ON payment_failures(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cancellations') THEN
    ALTER TABLE cancellations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_cancellations_business ON cancellations(business_id);
  END IF;
END $$;

-- 7. AUDIT AND COMMUNICATION TABLES (if they exist)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_audit_log') THEN
    ALTER TABLE security_audit_log ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_business ON security_audit_log(business_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_communications') THEN
    ALTER TABLE client_communications ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_client_communications_business ON client_communications(business_id);
  END IF;
END $$;

-- 8. POPULATE business_id FOR EXISTING RECORDS
-- =====================================================
DO $$
DECLARE
  record_count INTEGER;
  business_record RECORD;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== POPULATING BUSINESS_ID FOR ADDITIONAL TABLES ===';
  RAISE NOTICE '';
  
  -- Get all user-business mappings
  FOR business_record IN 
    SELECT user_id, business_id 
    FROM user_businesses 
    WHERE is_active = true
    ORDER BY created_at ASC
  LOOP
    -- Profiles (link to primary business)
    UPDATE profiles 
    SET business_id = business_record.business_id 
    WHERE id = business_record.user_id AND business_id IS NULL;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    IF record_count > 0 THEN
      RAISE NOTICE 'Updated % profiles for user %', record_count, business_record.user_id;
    END IF;
    
    -- Timesheet entries (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_entries') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE timesheet_entries SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % timesheet_entries', record_count;
      END IF;
    END IF;
    
    -- Active shifts (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'active_shifts') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE active_shifts SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % active_shifts', record_count;
      END IF;
    END IF;
    
    -- Timesheet settings (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_settings') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE timesheet_settings SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % timesheet_settings', record_count;
      END IF;
    END IF;
    
    -- Job appointments (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_appointments') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE job_appointments SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % job_appointments', record_count;
      END IF;
    END IF;
    
    -- Note templates (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'note_templates') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE note_templates SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % note_templates', record_count;
      END IF;
    END IF;
    
    -- Supplier products (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_products') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE supplier_products SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % supplier_products', record_count;
      END IF;
    END IF;
    
    -- Purchase order items (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE purchase_order_items SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % purchase_order_items', record_count;
      END IF;
    END IF;
    
    -- Payments (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE payments SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % payments', record_count;
      END IF;
    END IF;
    
    -- Billing history (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_history') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE billing_history SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % billing_history', record_count;
      END IF;
    END IF;
    
    -- Payment failures (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_failures') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE payment_failures SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % payment_failures', record_count;
      END IF;
    END IF;
    
    -- Security audit log (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_audit_log') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE security_audit_log SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % security_audit_log', record_count;
      END IF;
    END IF;
    
    -- Client communications (if table exists)
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_communications') INTO table_exists;
    IF table_exists THEN
      EXECUTE 'UPDATE client_communications SET business_id = $1 WHERE user_id = $2 AND business_id IS NULL' 
        USING business_record.business_id, business_record.user_id;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      IF record_count > 0 THEN
        RAISE NOTICE 'Updated % client_communications', record_count;
      END IF;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
END $$;

-- 9. VERIFICATION SUMMARY (only for existing tables)
-- =====================================================
DO $$
DECLARE
  table_count INTEGER;
  with_biz_id INTEGER;
BEGIN
  RAISE NOTICE '=== VERIFICATION SUMMARY ===';
  RAISE NOTICE '';
  
  -- Profiles
  SELECT COUNT(*), COUNT(business_id) INTO table_count, with_biz_id FROM profiles;
  RAISE NOTICE 'profiles: % total, % with business_id', table_count, with_biz_id;
  
  -- Check all optional tables dynamically
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    EXECUTE 'SELECT COUNT(*), COUNT(business_id) FROM appointments' INTO table_count, with_biz_id;
    RAISE NOTICE 'appointments: % total, % with business_id', table_count, with_biz_id;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'note_templates') THEN
    EXECUTE 'SELECT COUNT(*), COUNT(business_id) FROM note_templates' INTO table_count, with_biz_id;
    RAISE NOTICE 'note_templates: % total, % with business_id', table_count, with_biz_id;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_products') THEN
    EXECUTE 'SELECT COUNT(*), COUNT(business_id) FROM supplier_products' INTO table_count, with_biz_id;
    RAISE NOTICE 'supplier_products: % total, % with business_id', table_count, with_biz_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Migration complete! All existing tables have business_id columns added.';
END $$;
