-- =====================================================
-- PAYMENTS & DEPOSITS SYSTEM
-- =====================================================
-- This migration adds comprehensive payment tracking and deposit workflow support

-- =====================================================
-- 1. PAYMENTS TABLE (Payment Ledger)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL, -- 'stripe', 'bank_transfer', 'cash', 'cheque', 'other'
  reference_number TEXT, -- Bank ref, cheque #, Stripe payment intent ID, etc
  notes TEXT,
  
  -- Stripe Integration (future)
  stripe_payment_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);
CREATE INDEX IF NOT EXISTS payments_stripe_payment_id_idx ON payments(stripe_payment_id);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payments" ON payments;
CREATE POLICY "Users manage own payments" ON payments FOR ALL USING (auth.uid() = user_id);


-- =====================================================
-- 2. INVOICE TYPE & PAYMENT TRACKING ENHANCEMENTS
-- =====================================================

-- Add invoice type field
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'type') THEN
    ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'deposit', 'final'));
  END IF;
END $$;

-- Ensure amount_paid exists (should already exist based on earlier analysis)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount_paid') THEN
    ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add payment tracking fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_count') THEN
    ALTER TABLE invoices ADD COLUMN payment_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'last_payment_date') THEN
    ALTER TABLE invoices ADD COLUMN last_payment_date DATE;
  END IF;
END $$;

-- Add index on invoice type
CREATE INDEX IF NOT EXISTS invoices_type_idx ON invoices(type);


-- =====================================================
-- 3. BUSINESS SETTINGS - DEPOSIT CONFIGURATION
-- =====================================================

DO $$
BEGIN
  -- Deposit requirement toggle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'deposit_required') THEN
    ALTER TABLE business_settings ADD COLUMN deposit_required BOOLEAN DEFAULT false;
  END IF;
  
  -- Default deposit percentage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'deposit_percentage') THEN
    ALTER TABLE business_settings ADD COLUMN deposit_percentage DECIMAL(5,2) DEFAULT 30.0 CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100);
  END IF;
  
  -- Future-proofing: payment structure type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_settings' AND column_name = 'payment_structure_type') THEN
    ALTER TABLE business_settings ADD COLUMN payment_structure_type TEXT DEFAULT 'full_upfront' CHECK (payment_structure_type IN ('full_upfront', 'deposit_balance'));
  END IF;
END $$;


-- =====================================================
-- 4. JOB-LEVEL PAYMENT STATE TRACKING
-- =====================================================

DO $$
BEGIN
  -- Whether job requires deposit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deposit_required') THEN
    ALTER TABLE jobs ADD COLUMN deposit_required BOOLEAN DEFAULT false;
  END IF;
  
  -- Whether deposit has been paid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deposit_paid') THEN
    ALTER TABLE jobs ADD COLUMN deposit_paid BOOLEAN DEFAULT false;
  END IF;
  
  -- Whether job is fully paid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'fully_paid') THEN
    ALTER TABLE jobs ADD COLUMN fully_paid BOOLEAN DEFAULT false;
  END IF;
  
  -- Total amount paid across all invoices
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'total_paid') THEN
    ALTER TABLE jobs ADD COLUMN total_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Deposit invoice reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deposit_invoice_id') THEN
    ALTER TABLE jobs ADD COLUMN deposit_invoice_id UUID REFERENCES invoices(id);
  END IF;
  
  -- Final invoice reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'final_invoice_id') THEN
    ALTER TABLE jobs ADD COLUMN final_invoice_id UUID REFERENCES invoices(id);
  END IF;
END $$;

-- Indexes for job payment tracking
CREATE INDEX IF NOT EXISTS jobs_deposit_paid_idx ON jobs(deposit_paid);
CREATE INDEX IF NOT EXISTS jobs_fully_paid_idx ON jobs(fully_paid);


-- =====================================================
-- 5. FUNCTION: AUTO-UPDATE INVOICE STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate amount_paid from payments
  UPDATE invoices
  SET 
    amount_paid = COALESCE((
      SELECT SUM(amount) 
      FROM payments 
      WHERE invoice_id = NEW.invoice_id
    ), 0),
    payment_count = COALESCE((
      SELECT COUNT(*) 
      FROM payments 
      WHERE invoice_id = NEW.invoice_id
    ), 0),
    last_payment_date = (
      SELECT MAX(payment_date) 
      FROM payments 
      WHERE invoice_id = NEW.invoice_id
    )
  WHERE id = NEW.invoice_id;
  
  -- Update status based on payment amount
  UPDATE invoices
  SET status = CASE
    WHEN amount_paid = 0 THEN 
      CASE 
        WHEN status = 'draft' THEN 'draft'
        ELSE 'sent'
      END
    WHEN amount_paid > 0 AND amount_paid < total THEN 'partially_paid'
    WHEN amount_paid >= total THEN 'paid'
    ELSE status
  END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update invoice status when payment is added
DROP TRIGGER IF EXISTS trigger_update_invoice_status_on_payment ON payments;
CREATE TRIGGER trigger_update_invoice_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();


-- =====================================================
-- 6. FUNCTION: UPDATE JOB PAYMENT STATE
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_payment_state()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
  v_total_paid DECIMAL(10,2);
  v_job_total DECIMAL(10,2);
  v_deposit_invoice_paid BOOLEAN;
BEGIN
  -- Get job_id from invoice
  SELECT job_id INTO v_job_id FROM invoices WHERE id = NEW.invoice_id;
  
  IF v_job_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate total paid across all job invoices
  SELECT 
    COALESCE(SUM(amount_paid), 0),
    MAX(total_amount)
  INTO v_total_paid, v_job_total
  FROM invoices
  WHERE job_id = v_job_id;
  
  -- Check if deposit invoice is fully paid
  SELECT 
    COALESCE(amount_paid >= total, false)
  INTO v_deposit_invoice_paid
  FROM invoices
  WHERE job_id = v_job_id AND type = 'deposit'
  LIMIT 1;
  
  -- Update job payment state
  UPDATE jobs
  SET
    total_paid = v_total_paid,
    deposit_paid = COALESCE(v_deposit_invoice_paid, false),
    fully_paid = (v_total_paid >= COALESCE(total_amount, 0))
  WHERE id = v_job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update job payment state when invoice changes
DROP TRIGGER IF EXISTS trigger_update_job_payment_state ON invoices;
CREATE TRIGGER trigger_update_job_payment_state
  AFTER UPDATE OF amount_paid ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_job_payment_state();


-- =====================================================
-- 7. HELPER VIEWS (Optional but useful)
-- =====================================================

-- View: Invoice balances
CREATE OR REPLACE VIEW invoice_balances AS
SELECT 
  i.id,
  i.invoice_number,
  i.type,
  i.status,
  i.total,
  COALESCE(i.amount_paid, 0) as amount_paid,
  (i.total - COALESCE(i.amount_paid, 0)) as balance_due,
  i.payment_count,
  i.last_payment_date,
  i.job_id,
  i.client_id,
  i.user_id
FROM invoices i;

-- View: Job payment summary
CREATE OR REPLACE VIEW job_payment_summary AS
SELECT
  j.id as job_id,
  j.job_number,
  j.title,
  j.status,
  j.total_amount as job_total,
  j.total_paid,
  (COALESCE(j.total_amount, 0) - COALESCE(j.total_paid, 0)) as balance_remaining,
  j.deposit_required,
  j.deposit_paid,
  j.fully_paid,
  j.user_id,
  j.client_id,
  COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'deposit') as deposit_invoice_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'final') as final_invoice_count,
  COUNT(DISTINCT i.id) as total_invoice_count
FROM jobs j
LEFT JOIN invoices i ON i.job_id = j.id
GROUP BY j.id, j.job_number, j.title, j.status, j.total_amount, j.total_paid, 
         j.deposit_required, j.deposit_paid, j.fully_paid, j.user_id, j.client_id;


-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Payments & Deposits System migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - payments table with full ledger tracking';
  RAISE NOTICE '  - invoice type field (standard/deposit/final)';
  RAISE NOTICE '  - business_settings: deposit_required, deposit_percentage';
  RAISE NOTICE '  - job payment state tracking fields';
  RAISE NOTICE '  - Auto-update triggers for invoice status';
  RAISE NOTICE '  - Helper views for balances and summaries';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update business settings UI to configure deposits';
  RAISE NOTICE '  2. Build payment recording interface';
  RAISE NOTICE '  3. Implement deposit invoice generation workflow';
END $$;
