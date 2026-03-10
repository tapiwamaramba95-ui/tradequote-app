-- Migration: Dashboard Actions Support
-- Description: Adds tables and columns needed for action buttons on dashboard
-- Date: 2026-03-08

-- Add columns to quotes table for validity tracking
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validity_extended_count INTEGER DEFAULT 0;

-- Add columns to invoices table for reminder tracking
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create client_communications table for tracking all client interactions
CREATE TABLE IF NOT EXISTS client_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  related_type TEXT NOT NULL CHECK (related_type IN ('quote', 'invoice', 'job', 'enquiry')),
  related_id UUID NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('quote_sent', 'invoice_sent', 'reminder', 'follow_up', 'general')),
  method TEXT NOT NULL CHECK (method IN ('email', 'phone', 'sms', 'in_person', 'other')),
  subject TEXT,
  message TEXT,
  sent_by UUID REFERENCES staff(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for client_communications
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_related_type_id ON client_communications(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_user_id ON client_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_sent_at ON client_communications(sent_at DESC);

-- Enable RLS on client_communications
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Users can view own communications" ON client_communications;
DROP POLICY IF EXISTS "Users can insert own communications" ON client_communications;
DROP POLICY IF EXISTS "Users can update own communications" ON client_communications;
DROP POLICY IF EXISTS "Users can delete own communications" ON client_communications;

-- Policy: Users can view their own communications
CREATE POLICY "Users can view own communications"
  ON client_communications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own communications
CREATE POLICY "Users can insert own communications"
  ON client_communications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own communications
CREATE POLICY "Users can update own communications"
  ON client_communications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own communications
CREATE POLICY "Users can delete own communications"
  ON client_communications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment on tables and columns
COMMENT ON TABLE client_communications IS 'Tracks all communications with clients including emails, calls, and follow-ups';
COMMENT ON COLUMN quotes.valid_until IS 'Date until which the quote is valid';
COMMENT ON COLUMN quotes.original_valid_until IS 'Original validity date before any extensions';
COMMENT ON COLUMN quotes.validity_extended_count IS 'Number of times quote validity has been extended';
COMMENT ON COLUMN invoices.last_reminder_sent IS 'Timestamp of the last payment reminder sent';
COMMENT ON COLUMN invoices.reminder_count IS 'Number of payment reminders sent for this invoice';
