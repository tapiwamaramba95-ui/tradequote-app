-- =====================================================
-- RECURRING JOBS SYSTEM
-- =====================================================
-- Allows creation of recurring job templates that auto-generate job instances
-- Supports flexible scheduling, auto-invoicing, and batch processing

-- 1. CREATE RECURRING JOBS TABLE (PARENT/TEMPLATE)
-- =====================================================

CREATE TABLE IF NOT EXISTS recurring_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Template info (copied to each instance)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Address (copied to instances)
  street_address VARCHAR(255),
  suburb VARCHAR(100),
  state VARCHAR(50),
  postcode VARCHAR(10),
  
  -- Assigned staff/connection (copied to instances)
  staff_member_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  assigned_connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
  
  -- Line items template (stored as JSONB, copied to instances)
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Recurring schedule
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly', 'custom')),
  interval_count INTEGER DEFAULT 1 CHECK (interval_count > 0),
  
  -- Days of week (for weekly/fortnightly) - 1=Monday, 7=Sunday
  days_of_week INTEGER[],
  
  -- Day of month (for monthly) - 1-31, or -1 for last day
  day_of_month INTEGER CHECK (day_of_month BETWEEN -1 AND 31),
  
  -- Month of year (for quarterly/yearly) - 1-12
  month_of_year INTEGER CHECK (month_of_year BETWEEN 1 AND 12),
  
  -- Start and end
  start_date DATE NOT NULL,
  end_type VARCHAR(50) NOT NULL CHECK (end_type IN ('never', 'after_occurrences', 'on_date')),
  end_after_occurrences INTEGER CHECK (end_after_occurrences IS NULL OR end_after_occurrences > 0),
  end_date DATE,
  
  -- Auto-generation settings
  generate_ahead_weeks INTEGER DEFAULT 2 CHECK (generate_ahead_weeks > 0),
  last_generated_date DATE,
  
  -- Auto-invoicing
  auto_invoice BOOLEAN DEFAULT false,
  invoice_timing VARCHAR(50) CHECK (invoice_timing IS NULL OR invoice_timing IN ('on_completion', 'on_schedule', 'batch_monthly', 'batch_quarterly')),
  invoice_batch_day INTEGER CHECK (invoice_batch_day IS NULL OR (invoice_batch_day BETWEEN 1 AND 31)),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_business ON recurring_jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_client ON recurring_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_status ON recurring_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_staff ON recurring_jobs(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_connection ON recurring_jobs(assigned_connection_id);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_active_generation ON recurring_jobs(status, last_generated_date) WHERE status = 'active';

-- Comments
COMMENT ON TABLE recurring_jobs IS 'Templates for recurring jobs that auto-generate job instances';
COMMENT ON COLUMN recurring_jobs.frequency IS 'How often the job repeats: daily, weekly, fortnightly, monthly, quarterly, yearly, custom';
COMMENT ON COLUMN recurring_jobs.days_of_week IS 'Array of days for weekly/fortnightly jobs (1=Mon, 7=Sun)';
COMMENT ON COLUMN recurring_jobs.generate_ahead_weeks IS 'How many weeks in advance to generate job instances';


-- 2. UPDATE JOBS TABLE TO LINK TO RECURRING PARENT
-- =====================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS recurring_job_id UUID REFERENCES recurring_jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recurrence_instance_number INTEGER,
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_jobs_recurring ON jobs(recurring_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_recurring ON jobs(is_recurring_instance) WHERE is_recurring_instance = true;

COMMENT ON COLUMN jobs.recurring_job_id IS 'Links to the recurring job template if this is a generated instance';
COMMENT ON COLUMN jobs.recurrence_instance_number IS 'Which occurrence number this is (1, 2, 3...)';
COMMENT ON COLUMN jobs.is_recurring_instance IS 'True if this job was auto-generated from a recurring template';


-- 3. CREATE RECURRING JOB HISTORY TABLE (AUDIT TRAIL)
-- =====================================================

CREATE TABLE IF NOT EXISTS recurring_job_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_job_id UUID NOT NULL REFERENCES recurring_jobs(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'paused', 'resumed', 'edited', 'cancelled', 'completed')),
  changes JSONB,
  affected_instances INTEGER,
  
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_history_job ON recurring_job_history(recurring_job_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_performed_at ON recurring_job_history(performed_at);

COMMENT ON TABLE recurring_job_history IS 'Audit trail for changes to recurring jobs and their impact on instances';


-- 4. CREATE INVOICE BATCHING TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS recurring_invoice_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_job_id UUID NOT NULL REFERENCES recurring_jobs(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Which instances are in this batch
  job_instance_ids UUID[],
  instance_count INTEGER,
  
  -- Batch period
  batch_period_start DATE,
  batch_period_end DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_batches_recurring ON recurring_invoice_batches(recurring_job_id);
CREATE INDEX IF NOT EXISTS idx_invoice_batches_invoice ON recurring_invoice_batches(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_batches_period ON recurring_invoice_batches(batch_period_start, batch_period_end);

COMMENT ON TABLE recurring_invoice_batches IS 'Tracks which job instances are included in batch invoices for recurring jobs';


-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE recurring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_batches ENABLE ROW LEVEL SECURITY;

-- Recurring Jobs Policies
DROP POLICY IF EXISTS "Users can view recurring jobs in their businesses" ON recurring_jobs;
CREATE POLICY "Users can view recurring jobs in their businesses" ON recurring_jobs
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create recurring jobs in their businesses" ON recurring_jobs;
CREATE POLICY "Users can create recurring jobs in their businesses" ON recurring_jobs
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update recurring jobs in their businesses" ON recurring_jobs;
CREATE POLICY "Users can update recurring jobs in their businesses" ON recurring_jobs
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete recurring jobs in their businesses" ON recurring_jobs;
CREATE POLICY "Users can delete recurring jobs in their businesses" ON recurring_jobs
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Recurring Job History Policies
DROP POLICY IF EXISTS "Users can view history in their businesses" ON recurring_job_history;
CREATE POLICY "Users can view history in their businesses" ON recurring_job_history
  FOR SELECT
  USING (
    recurring_job_id IN (
      SELECT id FROM recurring_jobs WHERE business_id IN (
        SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create history in their businesses" ON recurring_job_history;
CREATE POLICY "Users can create history in their businesses" ON recurring_job_history
  FOR INSERT
  WITH CHECK (
    recurring_job_id IN (
      SELECT id FROM recurring_jobs WHERE business_id IN (
        SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
      )
    )
  );

-- Recurring Invoice Batches Policies
DROP POLICY IF EXISTS "Users can view invoice batches in their businesses" ON recurring_invoice_batches;
CREATE POLICY "Users can view invoice batches in their businesses" ON recurring_invoice_batches
  FOR SELECT
  USING (
    recurring_job_id IN (
      SELECT id FROM recurring_jobs WHERE business_id IN (
        SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create invoice batches in their businesses" ON recurring_invoice_batches;
CREATE POLICY "Users can create invoice batches in their businesses" ON recurring_invoice_batches
  FOR INSERT
  WITH CHECK (
    recurring_job_id IN (
      SELECT id FROM recurring_jobs WHERE business_id IN (
        SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
      )
    )
  );


-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_recurring_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recurring_jobs_updated_at ON recurring_jobs;
CREATE TRIGGER trigger_recurring_jobs_updated_at
  BEFORE UPDATE ON recurring_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_jobs_updated_at();


-- 7. HELPER FUNCTION TO LOG HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION log_recurring_job_history(
  p_recurring_job_id UUID,
  p_action VARCHAR,
  p_changes JSONB DEFAULT NULL,
  p_affected_instances INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO recurring_job_history (
    recurring_job_id,
    action,
    changes,
    affected_instances,
    performed_by
  ) VALUES (
    p_recurring_job_id,
    p_action,
    p_changes,
    p_affected_instances,
    auth.uid()
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_recurring_job_history IS 'Helper function to log changes to recurring jobs for audit trail';
