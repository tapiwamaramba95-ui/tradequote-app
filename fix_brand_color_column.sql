-- Quick fix to add missing primary_brand_color column
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS primary_brand_color TEXT DEFAULT '#0EA5A4';

COMMENT ON COLUMN business_settings.primary_brand_color IS 'Primary brand color in hex format (e.g., #0EA5A4) used in emails and customer-facing documents';