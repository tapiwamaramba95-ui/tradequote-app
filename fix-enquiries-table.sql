-- =====================================================
-- Fix Enquiries Table Schema
-- Add missing columns for enquiry form submissions
-- =====================================================

-- Add columns for enquiry form data
ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id),
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS enquiry_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS suburb VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS postcode VARCHAR(20),
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS job_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_date DATE,
ADD COLUMN IF NOT EXISTS converted_to_job_id UUID REFERENCES jobs(id),
ADD COLUMN IF NOT EXISTS converted_to_quote_id UUID REFERENCES quotes(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS enquiries_business_id_idx ON enquiries(business_id);
CREATE INDEX IF NOT EXISTS enquiries_client_id_idx ON enquiries(client_id);
CREATE INDEX IF NOT EXISTS enquiries_enquiry_number_idx ON enquiries(enquiry_number);
CREATE INDEX IF NOT EXISTS enquiries_converted_to_job_id_idx ON enquiries(converted_to_job_id);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries(status);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN enquiries.business_id IS 'Link to business record';
COMMENT ON COLUMN enquiries.client_id IS 'Link to client record';
COMMENT ON COLUMN enquiries.enquiry_number IS 'Auto-generated enquiry number (e.g., ENQ0001)';
COMMENT ON COLUMN enquiries.name IS 'Customer name from enquiry form';
COMMENT ON COLUMN enquiries.email IS 'Customer email from enquiry form';
COMMENT ON COLUMN enquiries.phone IS 'Customer phone from enquiry form';
COMMENT ON COLUMN enquiries.address IS 'Full address from enquiry form (combined)';
COMMENT ON COLUMN enquiries.street_address IS 'Street address component';
COMMENT ON COLUMN enquiries.suburb IS 'Suburb component';
COMMENT ON COLUMN enquiries.state IS 'State component';
COMMENT ON COLUMN enquiries.postcode IS 'Postcode component';
COMMENT ON COLUMN enquiries.message IS 'Job description or details from enquiry form';
COMMENT ON COLUMN enquiries.job_type IS 'Type of job requested';
COMMENT ON COLUMN enquiries.preferred_date IS 'Customer preferred date';
COMMENT ON COLUMN enquiries.converted_to_job_id IS 'Link to job if converted';
COMMENT ON COLUMN enquiries.converted_to_quote_id IS 'Link to quote if converted';
