-- =====================================================
-- TRUSTED DEVICES TABLE FOR 2FA DEVICE TRUST
-- =====================================================
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_device 
ON trusted_devices(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires
ON trusted_devices(expires_at);

-- Enable RLS on trusted_devices table  
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own trusted devices
CREATE POLICY "Users can manage their own trusted devices" 
ON trusted_devices FOR ALL 
USING (auth.uid() = user_id);

-- Function to clean up expired trusted devices
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS void AS $$
BEGIN
    DELETE FROM trusted_devices 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled function to clean up expired devices daily
-- Note: You may need to set this up manually in Supabase Dashboard > Database > Cron Jobs
-- SELECT cron.schedule('cleanup-trusted-devices', '0 2 * * *', 'SELECT cleanup_expired_trusted_devices();');

-- Test that the table structure is correct
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'trusted_devices' 
ORDER BY ordinal_position;

RAISE NOTICE '✅ Trusted devices table created successfully!';
RAISE NOTICE '📝 2FA device trust functionality is now ready.';
RAISE NOTICE '⚡ Consider setting up a daily cron job to clean expired devices.';