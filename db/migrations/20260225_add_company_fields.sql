-- Add additional company information fields

-- Add GST registered field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_settings' AND column_name = 'gst_registered'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN gst_registered BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add company licence number field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_settings' AND column_name = 'company_licence_number'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN company_licence_number TEXT;
    END IF;
END $$;

-- Add currency field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_settings' AND column_name = 'currency'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN currency TEXT DEFAULT 'AUD';
    END IF;
END $$;

-- Add timezone field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_settings' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN timezone TEXT DEFAULT 'Australia/Sydney';
    END IF;
END $$;

COMMENT ON COLUMN business_settings.gst_registered IS 'Whether the business is registered for GST/VAT';
COMMENT ON COLUMN business_settings.company_licence_number IS 'Business or trade licence number';
COMMENT ON COLUMN business_settings.currency IS 'Business operating currency (e.g., AUD, USD, NZD)';
COMMENT ON COLUMN business_settings.timezone IS 'Business timezone for scheduling and timestamps';
