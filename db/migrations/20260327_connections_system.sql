-- =============================================
-- CONNECTIONS (SUBCONTRACTOR MANAGEMENT) SYSTEM
-- =============================================
-- This migration creates the connections system for inviting
-- and managing subcontractors with limited free accounts

-- 1. CREATE CONNECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who invited them
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_business_id UUID NOT NULL,
  
  -- Connection details
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Their user account (once they accept)
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'disconnected')),
  invitation_sent_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  
  -- Profile information
  trade VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  notes TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one connection per email per business
  UNIQUE(invited_by_business_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_business ON connections(invited_by_business_id);
CREATE INDEX IF NOT EXISTS idx_connections_invited_by ON connections(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_email ON connections(email);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_active ON connections(is_active) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE connections IS 'Manages subcontractor connections - invited users with limited free accounts';
COMMENT ON COLUMN connections.status IS 'pending: invitation sent, accepted: active connection, declined: rejected invitation, disconnected: removed';
COMMENT ON COLUMN connections.connected_user_id IS 'Once they accept invitation and create account, links to their auth.users record';
COMMENT ON COLUMN connections.hourly_rate IS 'Optional hourly rate for this subcontractor for costing purposes';

-- 2. UPDATE JOBS TABLE - ADD CONNECTION ASSIGNMENT
-- =============================================
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS assigned_connection_id UUID REFERENCES connections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_connection ON jobs(assigned_connection_id);

COMMENT ON COLUMN jobs.assigned_connection_id IS 'If job is assigned to a subcontractor connection';

-- 3. UPDATE USER_PROFILES TABLE - ADD CONNECTION FLAGS
-- =============================================
-- Note: Adjust table name if your profiles table has a different name
DO $$ 
BEGIN
  -- Add is_connection flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'is_connection') THEN
    ALTER TABLE profiles ADD COLUMN is_connection BOOLEAN DEFAULT false;
  END IF;
  
  -- Add account type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'connection_account_type') THEN
    ALTER TABLE profiles ADD COLUMN connection_account_type VARCHAR(50) DEFAULT 'full' 
      CHECK (connection_account_type IN ('full', 'limited'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_connection ON profiles(is_connection) WHERE is_connection = true;

COMMENT ON COLUMN profiles.is_connection IS 'True if this user is a subcontractor connection (invited by another user)';
COMMENT ON COLUMN profiles.connection_account_type IS 'full: normal account with all features, limited: connection account with restricted access';

-- 4. CREATE UPDATED_AT TRIGGER FOR CONNECTIONS
-- =============================================
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_connections_updated_at ON connections;
CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- 5. RLS POLICIES (Row Level Security)
-- =============================================
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can see connections they created
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  USING (auth.uid() = invited_by_user_id);

-- Users can see connections where they are the connected user
DROP POLICY IF EXISTS "Users can view connections they accepted" ON connections;
CREATE POLICY "Users can view connections they accepted"
  ON connections FOR SELECT
  USING (auth.uid() = connected_user_id);

-- Users can create connections
DROP POLICY IF EXISTS "Users can create connections" ON connections;
CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = invited_by_user_id);

-- Users can update their own connections
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
CREATE POLICY "Users can update their connections"
  ON connections FOR UPDATE
  USING (auth.uid() = invited_by_user_id OR auth.uid() = connected_user_id);

-- Users can delete their own connections
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
CREATE POLICY "Users can delete their connections"
  ON connections FOR DELETE
  USING (auth.uid() = invited_by_user_id);
