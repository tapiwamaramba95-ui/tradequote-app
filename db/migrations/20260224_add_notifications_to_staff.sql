-- Add notifications column to staff table
-- =====================================================

-- Add notifications column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'notifications'
  ) THEN
    ALTER TABLE staff ADD COLUMN notifications JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add mobile column if it doesn't exist (for mobile phone numbers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE staff ADD COLUMN mobile VARCHAR(30);
  END IF;
END $$;

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'username'
  ) THEN
    ALTER TABLE staff ADD COLUMN username VARCHAR(100);
  END IF;
END $$;
