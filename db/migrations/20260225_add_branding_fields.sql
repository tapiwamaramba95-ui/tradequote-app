-- Add branding customization fields to business_settings

-- Add primary_brand_color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_settings' AND column_name = 'primary_brand_color'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN primary_brand_color TEXT DEFAULT '#0EA5A4';
    END IF;
END $$;

COMMENT ON COLUMN business_settings.primary_brand_color IS 'Primary brand color in hex format (e.g., #0EA5A4) used in emails and customer-facing documents';
