-- =====================================================
-- INVOICE COSTING & MARGIN TRACKING SYSTEM
-- =====================================================
-- Created: 2026-03-06
-- Purpose: Auto-calculate costs, track profit margins, and CAC

-- =====================================================
-- ENQUIRIES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  client_id UUID REFERENCES clients(id),
  
  enquiry_source TEXT, -- 'phone', 'email', 'website', 'referral', 'walk-in'
  description TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'quoted', 'won', 'lost'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- UPDATE QUOTES TABLE
-- =====================================================
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES enquiries(id),
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id),
  ADD COLUMN IF NOT EXISTS total_quote_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_quote_cost DECIMAL(10,2) DEFAULT 0;

-- =====================================================
-- UPDATE TIMESHEET ENTRIES
-- =====================================================
ALTER TABLE timesheet_entries
  ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES enquiries(id),
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id),
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id),
  
  -- Costing (staff member's hourly rate)
  ADD COLUMN IF NOT EXISTS hourly_cost DECIMAL(10,2), -- What this hour costs YOU (from staff.hourly_rate)
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2); -- hours × hourly_cost

-- =====================================================
-- UPDATE INVOICE LINE ITEMS
-- =====================================================
-- Check if supplier_products table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_products') THEN
    ALTER TABLE invoice_line_items
      ADD COLUMN IF NOT EXISTS supplier_product_id UUID REFERENCES supplier_products(id);
  END IF;
END $$;

ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS labour_rate_id UUID REFERENCES labour_rates(id),
  ADD COLUMN IF NOT EXISTS line_item_type TEXT DEFAULT 'material', -- 'material', 'labour', 'custom'
  
  -- Pricing (what client pays)
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS line_total DECIMAL(10,2),
  
  -- Costing (what it costs you) - AUTO-CALCULATED
  ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2), -- From price list or labour rate
  ADD COLUMN IF NOT EXISTS line_cost DECIMAL(10,2), -- unit_cost × quantity
  ADD COLUMN IF NOT EXISTS line_profit DECIMAL(10,2), -- line_total - line_cost
  ADD COLUMN IF NOT EXISTS line_margin DECIMAL(5,2); -- (line_profit / line_total) × 100

-- Update unit_price and line_total from existing data if not set
UPDATE invoice_line_items
SET 
  unit_price = COALESCE(unit_price, price),
  line_total = COALESCE(line_total, total)
WHERE unit_price IS NULL OR line_total IS NULL;

-- =====================================================
-- UPDATE INVOICES TABLE
-- =====================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS material_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labour_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acquisition_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subcontractor_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_costs DECIMAL(10,2) DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin DECIMAL(5,2) DEFAULT 0;

-- =====================================================
-- UPDATE LABOUR RATES (ADD COST)
-- =====================================================
ALTER TABLE labour_rates
  ADD COLUMN IF NOT EXISTS cost_per_hour DECIMAL(10,2); -- What it costs YOU (optional)

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS enquiries_client_id_idx ON enquiries(client_id);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries(status);

CREATE INDEX IF NOT EXISTS quotes_enquiry_id_idx ON quotes(enquiry_id) WHERE enquiry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quotes_job_id_idx ON quotes(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS timesheet_enquiry_idx ON timesheet_entries(enquiry_id) WHERE enquiry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS timesheet_quote_idx ON timesheet_entries(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS timesheet_job_idx ON timesheet_entries(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS timesheet_invoice_idx ON timesheet_entries(invoice_id) WHERE invoice_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own enquiries" ON enquiries;
CREATE POLICY "Users manage own enquiries" ON enquiries
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- AUTO-CALCULATE TIMESHEET COSTS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_timesheet_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Get cost from staff member's hourly rate
  IF NEW.staff_member_id IS NOT NULL THEN
    -- Check if staff table exists and has hourly_rate column
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'staff'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'staff' AND column_name = 'hourly_rate'
    ) THEN
      EXECUTE format('SELECT hourly_rate FROM staff WHERE id = $1')
      INTO NEW.hourly_cost
      USING NEW.staff_member_id;
    END IF;
    
    -- If hourly_cost is set, calculate total_cost
    IF NEW.hourly_cost IS NOT NULL THEN
      NEW.total_cost = NEW.total_hours * NEW.hourly_cost;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_timesheet_cost_trigger ON timesheet_entries;
CREATE TRIGGER calculate_timesheet_cost_trigger
  BEFORE INSERT OR UPDATE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_timesheet_cost();

-- =====================================================
-- UPDATE ENQUIRY/QUOTE COSTS FROM TIMESHEETS
-- =====================================================
CREATE OR REPLACE FUNCTION update_quote_costs_from_timesheets()
RETURNS TRIGGER AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    v_quote_id = OLD.quote_id;
  ELSE
    v_quote_id = NEW.quote_id;
  END IF;
  
  -- Update quote costs (M&Q time on quotes)
  IF v_quote_id IS NOT NULL THEN
    UPDATE quotes SET
      total_quote_hours = (
        SELECT COALESCE(SUM(total_hours), 0)
        FROM timesheet_entries
        WHERE quote_id = v_quote_id AND type = 'measure_quote'
      ),
      total_quote_cost = (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM timesheet_entries
        WHERE quote_id = v_quote_id AND type = 'measure_quote'
      )
    WHERE id = v_quote_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_costs_trigger ON timesheet_entries;
CREATE TRIGGER update_quote_costs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_costs_from_timesheets();

-- =====================================================
-- AUTO-CALCULATE INVOICE LINE ITEM COSTS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_line_item_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Get cost from supplier product (materials) if table exists
  IF NEW.supplier_product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_products'
  ) THEN
    EXECUTE format('SELECT price FROM supplier_products WHERE id = $1')
    INTO NEW.unit_cost
    USING NEW.supplier_product_id;
    
    NEW.line_item_type = 'material';
  END IF;
  
  -- Get cost from labour rate (labour)
  IF NEW.labour_rate_id IS NOT NULL THEN
    SELECT cost_per_hour INTO NEW.unit_cost
    FROM labour_rates
    WHERE id = NEW.labour_rate_id;
    
    -- If no cost set, use hourly_rate as cost
    IF NEW.unit_cost IS NULL THEN
      SELECT hourly_rate INTO NEW.unit_cost
      FROM labour_rates
      WHERE id = NEW.labour_rate_id;
    END IF;
    
    NEW.line_item_type = 'labour';
  END IF;
  
  -- If neither, it's a custom item
  IF NEW.supplier_product_id IS NULL AND NEW.labour_rate_id IS NULL THEN
    NEW.line_item_type = 'custom';
  END IF;
  
  -- Ensure unit_price and line_total are set
  IF NEW.unit_price IS NULL AND NEW.price IS NOT NULL THEN
    NEW.unit_price = NEW.price;
  END IF;
  
  IF NEW.line_total IS NULL AND NEW.total IS NOT NULL THEN
    NEW.line_total = NEW.total;
  ELSIF NEW.line_total IS NULL AND NEW.unit_price IS NOT NULL THEN
    NEW.line_total = NEW.unit_price * NEW.quantity;
  END IF;
  
  -- Calculate line costs
  IF NEW.unit_cost IS NOT NULL THEN
    NEW.line_cost = NEW.unit_cost * NEW.quantity;
    NEW.line_profit = NEW.line_total - NEW.line_cost;
    NEW.line_margin = CASE 
      WHEN NEW.line_total > 0 
      THEN (NEW.line_profit / NEW.line_total * 100)
      ELSE 0 
    END;
  ELSE
    NEW.line_cost = NULL;
    NEW.line_profit = NULL;
    NEW.line_margin = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_line_costs_trigger ON invoice_line_items;
CREATE TRIGGER calculate_line_costs_trigger
  BEFORE INSERT OR UPDATE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_costs();

-- =====================================================
-- CALCULATE INVOICE TOTAL COSTS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_invoice_total_costs(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
  v_material_cost DECIMAL(10,2);
  v_labour_cost_from_timesheets DECIMAL(10,2);
  v_labour_cost_from_lines DECIMAL(10,2);
  v_acquisition_cost DECIMAL(10,2);
  v_job_id UUID;
  v_job_total DECIMAL(10,2);
  v_invoice_total DECIMAL(10,2);
  v_job_cac DECIMAL(10,2);
BEGIN
  -- Get invoice details
  SELECT job_id, total INTO v_job_id, v_invoice_total
  FROM invoices
  WHERE id = p_invoice_id;
  
  -- 1. Material cost from invoice line items (items linked to supplier products)
  SELECT COALESCE(SUM(line_cost), 0) INTO v_material_cost
  FROM invoice_line_items
  WHERE invoice_id = p_invoice_id
    AND line_item_type = 'material'
    AND line_cost IS NOT NULL;
  
  -- 2. Labour cost from timesheets (actual hours worked on job)
  IF v_job_id IS NOT NULL THEN
    SELECT COALESCE(SUM(total_cost), 0) INTO v_labour_cost_from_timesheets
    FROM timesheet_entries
    WHERE job_id = v_job_id
      AND type = 'job';
  ELSE
    v_labour_cost_from_timesheets = 0;
  END IF;
  
  -- 3. Labour cost from invoice lines (if manually added as line items)
  SELECT COALESCE(SUM(line_cost), 0) INTO v_labour_cost_from_lines
  FROM invoice_line_items
  WHERE invoice_id = p_invoice_id
    AND line_item_type = 'labour'
    AND line_cost IS NOT NULL;
  
  -- Use whichever is greater (or add both if they're different sources)
  -- For now, prefer timesheets if job exists, otherwise use line items
  
  -- 4. Acquisition cost (CAC) - proportional split if job has multiple invoices
  v_acquisition_cost = 0;
  
  IF v_job_id IS NOT NULL THEN
    -- Get total CAC for the job (sum all M&Q time)
    SELECT COALESCE(SUM(total_cost), 0) INTO v_job_cac
    FROM timesheet_entries
    WHERE job_id = v_job_id
      AND type = 'measure_quote';
    
    -- Get total revenue across all invoices for this job
    SELECT COALESCE(SUM(total), 0) INTO v_job_total
    FROM invoices
    WHERE job_id = v_job_id;
    
    -- Calculate proportional CAC
    IF v_job_total > 0 AND v_job_cac > 0 THEN
      v_acquisition_cost = (v_invoice_total / v_job_total) * v_job_cac;
    END IF;
  END IF;
  
  -- Check for direct CAC (M&Q time linked directly to invoice)
  IF v_acquisition_cost = 0 THEN
    SELECT COALESCE(SUM(total_cost), 0) INTO v_acquisition_cost
    FROM timesheet_entries
    WHERE invoice_id = p_invoice_id
      AND type = 'measure_quote';
  END IF;
  
  -- Update invoice with calculated costs
  UPDATE invoices SET
    material_cost = v_material_cost,
    labour_cost = GREATEST(v_labour_cost_from_timesheets, v_labour_cost_from_lines),
    acquisition_cost = v_acquisition_cost,
    total_cost = v_material_cost + 
                 GREATEST(v_labour_cost_from_timesheets, v_labour_cost_from_lines) + 
                 v_acquisition_cost + 
                 COALESCE(subcontractor_cost, 0) + 
                 COALESCE(other_costs, 0),
    gross_profit = total - (
      v_material_cost + 
      GREATEST(v_labour_cost_from_timesheets, v_labour_cost_from_lines) + 
      v_acquisition_cost + 
      COALESCE(subcontractor_cost, 0) + 
      COALESCE(other_costs, 0)
    ),
    margin = CASE 
      WHEN total > 0 
      THEN (
        (total - (
          v_material_cost + 
          GREATEST(v_labour_cost_from_timesheets, v_labour_cost_from_lines) + 
          v_acquisition_cost + 
          COALESCE(subcontractor_cost, 0) + 
          COALESCE(other_costs, 0)
        )) / total * 100
      )
      ELSE 0 
    END
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO UPDATE INVOICE COSTS
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_update_invoice_costs()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    v_invoice_id = OLD.invoice_id;
  ELSE
    v_invoice_id = NEW.invoice_id;
  END IF;
  
  -- Update invoice costs when line items change
  IF TG_TABLE_NAME = 'invoice_line_items' THEN
    IF v_invoice_id IS NOT NULL THEN
      PERFORM calculate_invoice_total_costs(v_invoice_id);
    END IF;
  END IF;
  
  -- Update invoice costs when timesheets change
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Update all invoices for this job
    IF TG_OP = 'DELETE' THEN
      IF OLD.job_id IS NOT NULL THEN
        PERFORM calculate_invoice_total_costs(i.id)
        FROM invoices i
        WHERE i.job_id = OLD.job_id;
      END IF;
      
      -- Update specific invoice if directly linked
      IF OLD.invoice_id IS NOT NULL THEN
        PERFORM calculate_invoice_total_costs(OLD.invoice_id);
      END IF;
    ELSE
      IF NEW.job_id IS NOT NULL THEN
        PERFORM calculate_invoice_total_costs(i.id)
        FROM invoices i
        WHERE i.job_id = NEW.job_id;
      END IF;
      
      -- Update specific invoice if directly linked
      IF NEW.invoice_id IS NOT NULL THEN
        PERFORM calculate_invoice_total_costs(NEW.invoice_id);
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_costs_from_lines ON invoice_line_items;
CREATE TRIGGER update_invoice_costs_from_lines
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_invoice_costs();

DROP TRIGGER IF EXISTS update_invoice_costs_from_timesheets ON timesheet_entries;
CREATE TRIGGER update_invoice_costs_from_timesheets
  AFTER INSERT OR UPDATE OR DELETE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_invoice_costs();
