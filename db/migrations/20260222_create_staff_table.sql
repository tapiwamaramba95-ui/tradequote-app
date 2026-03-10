-- Migration: Create staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(30),
  role VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  hourly_cost NUMERIC(10,2),
  billing_rate VARCHAR(50),
  licence_number VARCHAR(50),
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Add index for quick lookup
CREATE INDEX idx_staff_email ON staff(email);
