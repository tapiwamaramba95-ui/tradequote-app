-- Migration: Purchase Orders, Invoices, GRNs, Suppliers (minimal schema)
-- Run these in your Supabase SQL editor. Adjust types and policies to match your project.

-- Suppliers table (if not already present)
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  mobile text,
  address jsonb,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  status text DEFAULT 'draft',
  total numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Invoices (minimal)
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  total numeric(12,2) DEFAULT 0,
  status text DEFAULT 'draft',
  source_purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goods Received Notes (GRNs)
CREATE TABLE IF NOT EXISTS grns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  received_at timestamptz,
  total numeric(12,2) DEFAULT 0,
  status text DEFAULT 'received',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grns_po ON grns(purchase_order_id);

-- Ensure `source_purchase_order_id` exists on existing `invoices` table (safe ALTER)
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS source_purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_source_po ON invoices(source_purchase_order_id);

-- Example Row Level Security (RLS) policies
-- NOTE: Adjust policies to match your auth scheme and roles. The service role key will bypass RLS.

-- Enable RLS on tables you want protected
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grns ENABLE ROW LEVEL SECURITY;


-- Seed data (example)
-- Insert suppliers
INSERT INTO suppliers (id, name, email, phone, address, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Supplies', 'acme@example.com', '123456789', '{"street": "123 Main St", "city": "Harare"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, name, email, phone, address, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Global Traders', 'global@example.com', '987654321', '{"street": "456 Market Ave", "city": "Bulawayo"}', true)
ON CONFLICT (id) DO NOTHING;

-- Insert purchase orders
INSERT INTO purchase_orders (id, reference, supplier_id, status, total)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'PO-2026-001', '00000000-0000-0000-0000-000000000001', 'draft', 1500.00),
  ('00000000-0000-0000-0000-000000000102', 'PO-2026-002', '00000000-0000-0000-0000-000000000002', 'issued', 2500.00)
ON CONFLICT (id) DO NOTHING;

-- Insert invoices
INSERT INTO invoices (id, reference, supplier_id, total, status, source_purchase_order_id)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'INV-2026-001', '00000000-0000-0000-0000-000000000001', 1500.00, 'draft', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'INV-2026-002', '00000000-0000-0000-0000-000000000002', 2500.00, 'issued', '00000000-0000-0000-0000-000000000102')
ON CONFLICT (id) DO NOTHING;

-- Insert GRNs
INSERT INTO grns (id, purchase_order_id, supplier_id, received_at, total, status)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '2026-02-17T10:00:00Z', 1500.00, 'received'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', '2026-02-17T11:00:00Z', 2500.00, 'received')
ON CONFLICT (id) DO NOTHING;
-- Keep service role key for admin operations only.

-- End of migration
