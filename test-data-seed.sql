-- ================================================
-- TEST DATA SEED FILE
-- TradeCraft Application
-- User ID: 04df4341-54ff-4ce2-a14c-bdfe709e4fb2
-- ================================================
-- 
-- INSTRUCTIONS:
-- 1. Run the function fix at the top
-- 2. Run STEP 1 to insert clients
-- 3. Run STEP 2 to insert jobs
-- 4. Run STEP 3 to insert appointments
-- 5. Run STEP 4 to insert quotes
-- 6. Run STEP 5 to insert invoices
-- 7. Run STEP 6 to insert enquiries
-- 8. Run verification query at the end
--
-- All IDs are pre-filled. No manual replacement needed!
-- ================================================

-- ================================================
-- ⚠️⚠️⚠️ CRITICAL: RUN THIS FIRST! ⚠️⚠️⚠️
-- FIX: Update calculate_job_totals function
-- ================================================
-- This MUST be run BEFORE inserting any data!
-- The old function references non-existent columns and will cause errors.
-- 
-- Copy lines 20-107 and run them in your database first.
-- ================================================

CREATE OR REPLACE FUNCTION calculate_job_totals(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_labour_cost DECIMAL(10,2) := 0;
  v_acquisition_cost DECIMAL(10,2) := 0;
  v_quoted_amount DECIMAL(10,2) := 0;
  v_invoiced_amount DECIMAL(10,2) := 0;
  v_paid_amount DECIMAL(10,2) := 0;
BEGIN
  -- 1. Labour cost (from timesheets - event_type = 'work')
  -- Only if timesheet_entries table exists
  BEGIN
    SELECT COALESCE(SUM(total_cost), 0) INTO v_labour_cost
    FROM timesheet_entries
    WHERE job_id = p_job_id
      AND event_type = 'work';
  EXCEPTION
    WHEN others THEN
      v_labour_cost := 0;
  END;
  
  -- 2. Acquisition cost (from timesheets - event_type = 'measure_quote')
  BEGIN
    SELECT COALESCE(SUM(total_cost), 0) INTO v_acquisition_cost
    FROM timesheet_entries
    WHERE job_id = p_job_id
      AND event_type = 'measure_quote';
  EXCEPTION
    WHEN others THEN
      v_acquisition_cost := 0;
  END;
  
  -- 3. Quoted amount (from accepted or latest quote)
  BEGIN
    SELECT total INTO v_quoted_amount
    FROM quotes
    WHERE job_id = p_job_id
      AND (is_accepted = true OR quote_version = (
        SELECT MAX(quote_version) FROM quotes WHERE job_id = p_job_id
      ))
    ORDER BY is_accepted DESC, quote_version DESC
    LIMIT 1;
  EXCEPTION
    WHEN others THEN
      v_quoted_amount := 0;
  END;
  
  -- 4. Invoiced amount (sum of all invoices)
  SELECT COALESCE(SUM(total), 0) INTO v_invoiced_amount
  FROM invoices
  WHERE job_id = p_job_id;
  
  -- 5. Paid amount (sum of paid invoices)
  SELECT COALESCE(SUM(total), 0) INTO v_paid_amount
  FROM invoices
  WHERE job_id = p_job_id
    AND status = 'paid';
  
  -- Update job with all totals
  -- Only update columns that exist in the jobs table
  UPDATE jobs SET
    quoted_amount = COALESCE(v_quoted_amount, 0),
    invoiced_amount = COALESCE(v_invoiced_amount, 0),
    paid_amount = COALESCE(v_paid_amount, 0),
    updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Try to update cost tracking columns if they exist
  BEGIN
    UPDATE jobs SET
      total_labour_cost = v_labour_cost,
      total_acquisition_cost = v_acquisition_cost,
      total_cost = v_labour_cost + v_acquisition_cost,
      gross_profit = v_invoiced_amount - (v_labour_cost + v_acquisition_cost),
      margin = CASE 
        WHEN v_invoiced_amount > 0 
        THEN ((v_invoiced_amount - (v_labour_cost + v_acquisition_cost)) / v_invoiced_amount * 100)
        ELSE 0 
      END
    WHERE id = p_job_id;
  EXCEPTION
    WHEN others THEN
      NULL; -- Ignore if these columns don't exist
  END;
END;
$$ LANGUAGE plpgsql;

-- ✅ If you see "CREATE FUNCTION" in the output, the fix worked!
-- Now you can proceed with the data inserts below.

-- ================================================
-- STEP 1: INSERT CLIENTS (7 records)
-- ================================================

INSERT INTO clients (
  user_id,
  name,
  email,
  phone,
  street_address,
  suburb,
  state,
  postcode,
  notes,
  created_at
) VALUES 
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'ABC Plumbing Pty Ltd',
  'contact@abcplumbing.com.au',
  '0412 345 678',
  '45 Workshop Street',
  'Richmond',
  'VIC',
  '3121',
  'Large commercial client - priority service',
  NOW() - INTERVAL '30 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Melbourne Building Co',
  'admin@melbournebuild.com.au',
  '0423 456 789',
  '128 Chapel Street',
  'South Yarra',
  'VIC',
  '3141',
  'Regular residential renovations',
  NOW() - INTERVAL '25 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Smith Family Residence',
  'john.smith@email.com',
  '0434 567 890',
  '73 Beach Road',
  'Brighton',
  'VIC',
  '3186',
  'Bathroom renovation project',
  NOW() - INTERVAL '20 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Renovations R Us',
  'info@renovationsrus.com.au',
  '0445 678 901',
  '256 Collins Street',
  'Melbourne',
  'VIC',
  '3000',
  'Corporate building maintenance',
  NOW() - INTERVAL '15 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Green Valley Apartments',
  'manager@greenvalley.com.au',
  '0456 789 012',
  '89 Fitzroy Street',
  'St Kilda',
  'VIC',
  '3182',
  'Apartment complex - multiple units',
  NOW() - INTERVAL '10 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Johnson Residence',
  'sarah.johnson@email.com',
  '0467 890 123',
  '42 Toorak Road',
  'Toorak',
  'VIC',
  '3142',
  'Kitchen renovation enquiry',
  NOW() - INTERVAL '5 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'Westside Shopping Centre',
  'maintenance@westside.com.au',
  '0478 901 234',
  '150 High Street',
  'Footscray',
  'VIC',
  '3011',
  'Commercial property - emergency contact',
  NOW() - INTERVAL '2 days'
);

-- Verify clients
SELECT id, name FROM clients WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY created_at DESC LIMIT 7;

-- ================================================
-- STEP 2: INSERT JOBS (7 records)
-- ================================================

INSERT INTO jobs (
  user_id,
  client_id,
  job_name,
  description,
  status,
  street_address,
  suburb,
  state,
  postcode,
  quoted_amount,
  scheduled_date,
  created_at
) VALUES 
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8125142c-faf5-4962-ad67-d51e942e76fa',  -- ABC Plumbing
  'Bathroom Renovation - Smith Residence',
  'Complete bathroom renovation including new tiles, fixtures, and plumbing. Replace bathtub with walk-in shower. Install heated towel rail.',
  'in_progress',
  '73 Beach Road',
  'Brighton',
  'VIC',
  '3186',
  9350.00,
  '2024-03-10',
  NOW() - INTERVAL '15 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'dcfdbf19-069f-4bc4-a2b4-7d9960c24433',  -- Melbourne Building Co
  'Kitchen Fit-out - 45 Chapel St',
  'Commercial kitchen installation for new restaurant. Includes plumbing for dishwasher, ice maker, and prep sinks.',
  'in_progress',
  '128 Chapel Street',
  'South Yarra',
  'VIC',
  '3141',
  5700.00,
  '2024-03-12',
  NOW() - INTERVAL '12 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'bd340b57-6670-4e80-957b-16a9205b6568',  -- Smith Family Residence
  'Emergency Leak Repair - Collins Building',
  'Emergency call-out for burst pipe in basement. Locate source, repair, and assess water damage.',
  'completed',
  '256 Collins Street',
  'Melbourne',
  'VIC',
  '3000',
  1056.00,
  '2024-03-01',
  NOW() - INTERVAL '14 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8c4b15f5-6ff2-413c-8c50-c68e800d6520',  -- Renovations R Us
  'Hot Water System Installation - Unit 12',
  'Replace old electric hot water system with new gas continuous flow system. Includes gas line installation.',
  'quoted',
  '89 Fitzroy Street',
  'St Kilda',
  'VIC',
  '3182',
  3520.00,
  '2024-03-25',
  NOW() - INTERVAL '8 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '2cf5ff16-a0c7-4334-8529-3fb20821e744',  -- Green Valley Apartments
  'Laundry Renovation',
  'Relocate laundry plumbing to new position. Install new washing machine taps and drainage.',
  'quoted',
  '42 Toorak Road',
  'Toorak',
  'VIC',
  '3142',
  3080.00,
  NULL,
  NOW() - INTERVAL '5 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '220f7ef8-cafd-411c-b542-9b450de725d9',  -- Johnson Residence
  'Preventative Maintenance - Food Court',
  'Quarterly maintenance check of all food court plumbing. Inspect grease traps, clean drains, check for leaks.',
  'completed',
  '150 High Street',
  'Footscray',
  'VIC',
  '3011',
  374.00,
  '2024-02-28',
  NOW() - INTERVAL '16 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '9f41a833-4a2f-4635-b43d-a68c959dc2d5',  -- Westside Shopping Centre
  'Office Bathroom Upgrade',
  'Upgrade office bathrooms with water-efficient fixtures. Install dual-flush toilets and sensor taps.',
  'in_progress',
  '45 Workshop Street',
  'Richmond',
  'VIC',
  '3121',
  1700.00,
  '2024-03-18',
  NOW() - INTERVAL '3 days'
);

-- Verify jobs
SELECT id, job_number, job_name FROM jobs WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY created_at DESC LIMIT 7;

-- ================================================
-- STEP 3: INSERT APPOINTMENTS (7 records)
-- ================================================

INSERT INTO job_appointments (
  user_id,
  job_id,
  appointment_type,
  scheduled_date,
  duration_minutes,
  notes,
  status,
  created_at
) VALUES 
-- Today and upcoming
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'b6493613-6fc8-430c-a40b-a59204b4fb3a',  -- Bathroom Renovation
  'work',
  CURRENT_DATE + TIME '09:00:00',
  360,  -- 6 hours
  'Bathroom Renovation - Day 3: Continue tile installation in shower area',
  'scheduled',
  NOW()
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'b8962af2-09e8-4ae1-92b9-35988df7eeb5',  -- Kitchen Fit-out
  'measure_quote',
  CURRENT_DATE + TIME '14:00:00',
  120,  -- 2 hours
  'Kitchen Fit-out - Initial site inspection with client',
  'scheduled',
  NOW()
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8c03b596-2671-448b-a4a8-5aee6b60da4f',  -- Office Bathroom Upgrade
  'work',
  CURRENT_DATE + INTERVAL '1 day' + TIME '08:00:00',
  540,  -- 9 hours
  'Office Bathroom - Start: Begin office bathroom upgrade project',
  'scheduled',
  NOW()
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'b6493613-6fc8-430c-a40b-a59204b4fb3a',  -- Bathroom Renovation
  'work',
  CURRENT_DATE + INTERVAL '2 days' + TIME '09:00:00',
  360,  -- 6 hours
  'Bathroom Renovation - Plumbing Rough-in: Complete plumbing rough-in work',
  'scheduled',
  NOW()
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '01ea8439-81fb-44be-b8c0-5aa711ba4706',  -- Hot Water System Installation
  'work',
  CURRENT_DATE + INTERVAL '3 days' + TIME '10:00:00',
  240,  -- 4 hours
  'Hot Water Installation - Unit 12: Install new gas hot water system',
  'scheduled',
  NOW()
),
-- Past appointments
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '6f51a843-b310-4239-82d0-672f86303d74',  -- Emergency Leak Repair
  'work',
  CURRENT_DATE - INTERVAL '5 days' + TIME '16:00:00',
  240,  -- 4 hours
  'Emergency Leak Repair: Emergency call-out - burst pipe',
  'completed',
  NOW() - INTERVAL '5 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'e8b2c6e2-56c1-47fd-824e-e0ba179da419',  -- Preventative Maintenance
  'work',
  CURRENT_DATE - INTERVAL '10 days' + TIME '09:00:00',
  180,  -- 3 hours
  'Preventative Maintenance: Quarterly maintenance check',
  'completed',
  NOW() - INTERVAL '10 days'
);

-- Verify appointments
SELECT appointment_type, scheduled_date, status FROM job_appointments WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY scheduled_date DESC LIMIT 7;

-- ================================================
-- STEP 4: INSERT QUOTES (4 records)
-- ================================================

INSERT INTO quotes (
  user_id,
  client_id,
  job_id,
  quote_number,
  status,
  subtotal,
  tax,
  total,
  valid_until,
  notes,
  created_at
) VALUES 
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '2cf5ff16-a0c7-4334-8529-3fb20821e744',  -- Green Valley Apartments
  '329e7cb3-0e61-4420-ae64-ef0b631e5e1b',  -- Laundry Renovation
  'Q00001',
  'sent',
  2800.00,
  280.00,
  3080.00,
  CURRENT_DATE + INTERVAL '14 days',
  'Complete laundry renovation with plumbing relocation',
  NOW() - INTERVAL '5 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8125142c-faf5-4962-ad67-d51e942e76fa',  -- ABC Plumbing
  'b6493613-6fc8-430c-a40b-a59204b4fb3a',  -- Bathroom Renovation
  'Q00002',
  'accepted',
  8500.00,
  850.00,
  9350.00,
  CURRENT_DATE - INTERVAL '5 days',
  'Full bathroom renovation including fixtures and tiling',
  NOW() - INTERVAL '20 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8c4b15f5-6ff2-413c-8c50-c68e800d6520',  -- Renovations R Us
  '01ea8439-81fb-44be-b8c0-5aa711ba4706',  -- Hot Water System Installation
  'Q00003',
  'accepted',
  3200.00,
  320.00,
  3520.00,
  CURRENT_DATE + INTERVAL '7 days',
  'Replace electric with gas continuous flow system',
  NOW() - INTERVAL '8 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '9f41a833-4a2f-4635-b43d-a68c959dc2d5',  -- Westside Shopping Centre
  '8c03b596-2671-448b-a4a8-5aee6b60da4f',  -- Office Bathroom Upgrade
  'Q00004',
  'draft',
  4800.00,
  480.00,
  5280.00,
  CURRENT_DATE + INTERVAL '30 days',
  'Quarterly preventative maintenance for food court plumbing',
  NOW() - INTERVAL '2 days'
);

-- Verify quotes
SELECT quote_number, status, total FROM quotes WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY created_at DESC;

-- ================================================
-- STEP 5: INSERT INVOICES (6 records)
-- ================================================

INSERT INTO invoices (
  user_id,
  client_id,
  job_id,
  invoice_number,
  status,
  issue_date,
  due_date,
  subtotal,
  tax,
  total,
  amount_paid,
  notes,
  created_at
) VALUES 
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'bd340b57-6670-4e80-957b-16a9205b6568',  -- Smith Family Residence
  '6f51a843-b310-4239-82d0-672f86303d74',  -- Emergency Leak Repair
  'INV-2024-001',
  'paid',
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE - INTERVAL '7 days',
  960.00,
  96.00,
  1056.00,
  1056.00,
  'Emergency call-out and burst pipe repair - PAID',
  NOW() - INTERVAL '14 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '220f7ef8-cafd-411c-b542-9b450de725d9',  -- Johnson Residence
  'e8b2c6e2-56c1-47fd-824e-e0ba179da419',  -- Preventative Maintenance
  'INV-2024-002',
  'paid',
  CURRENT_DATE - INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '9 days',
  340.00,
  34.00,
  374.00,
  374.00,
  'Quarterly maintenance check of food court plumbing - PAID',
  NOW() - INTERVAL '16 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8125142c-faf5-4962-ad67-d51e942e76fa',  -- ABC Plumbing
  'b6493613-6fc8-430c-a40b-a59204b4fb3a',  -- Bathroom Renovation
  'INV-2024-003',
  'sent',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '7 days',
  4675.00,
  467.50,
  5142.50,
  0,
  'First progress payment - 50% of total',
  NOW() - INTERVAL '7 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'dcfdbf19-069f-4bc4-a2b4-7d9960c24433',  -- Melbourne Building Co
  'b8962af2-09e8-4ae1-92b9-35988df7eeb5',  -- Kitchen Fit-out
  'INV-2024-004',
  'sent',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '11 days',
  2850.00,
  285.00,
  3135.00,
  0,
  'Materials supply for commercial kitchen installation',
  NOW() - INTERVAL '3 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '9f41a833-4a2f-4635-b43d-a68c959dc2d5',  -- Westside Shopping Centre
  '8c03b596-2671-448b-a4a8-5aee6b60da4f',  -- Office Bathroom Upgrade
  'INV-2024-005',
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days',
  510.00,
  51.00,
  561.00,
  0,
  '30% deposit for office bathroom upgrade project',
  NOW()
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '8c4b15f5-6ff2-413c-8c50-c68e800d6520',  -- Renovations R Us
  NULL,
  'INV-2024-006',
  'overdue',
  CURRENT_DATE - INTERVAL '25 days',
  CURRENT_DATE - INTERVAL '11 days',
  150.00,
  15.00,
  165.00,
  0,
  'On-site consultation and assessment',
  NOW() - INTERVAL '25 days'
);

-- Verify invoices
SELECT invoice_number, status, total FROM invoices WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY created_at DESC;

-- ================================================
-- STEP 6: INSERT ENQUIRIES (4 records)
-- ================================================

INSERT INTO enquiries (
  user_id,
  client_id,
  subject,
  description,
  status,
  priority,
  created_at
) VALUES 
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  'bd340b57-6670-4e80-957b-16a9205b6568',  -- Smith Family Residence
  'Bathroom Renovation Quote Request',
  'Client enquiring about bathroom renovation. Looking to replace old bathtub with modern walk-in shower and update all fixtures. Prefers contemporary style.',
  'new',
  'high',
  NOW() - INTERVAL '2 hours'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '220f7ef8-cafd-411c-b542-9b450de725d9',  -- Johnson Residence
  'Kitchen Renovation - Electrical Query',
  'Follow-up required for kitchen renovation electrical work. Client needs quote for new appliances installation and additional power points.',
  'in_progress',
  'medium',
  NOW() - INTERVAL '1 day'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '9f41a833-4a2f-4635-b43d-a68c959dc2d5',  -- Westside Shopping Centre
  'Maintenance Contract Request',
  'Commercial client interested in quarterly preventative maintenance contract for shopping centre plumbing systems. Requires site inspection.',
  'completed',
  'medium',
  NOW() - INTERVAL '3 days'
),
(
  '04df4341-54ff-4ce2-a14c-bdfe709e4fb2',
  '2cf5ff16-a0c7-4334-8529-3fb20821e744',  -- Green Valley Apartments
  'URGENT: Hot Water System Failure',
  'Emergency call received. Hot water system in Unit 7 has completely failed. Tenant reports no hot water for 2 days. Requires immediate attention.',
  'resolved',
  'high',
  NOW() - INTERVAL '5 days'
);

-- Verify enquiries
SELECT subject, status, priority FROM enquiries WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2' ORDER BY created_at DESC;

-- ================================================
-- ✅ VERIFICATION - Run This Last
-- ================================================

SELECT 
  (SELECT COUNT(*) FROM clients WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as clients,
  (SELECT COUNT(*) FROM jobs WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as jobs,
  (SELECT COUNT(*) FROM job_appointments WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as appointments,
  (SELECT COUNT(*) FROM quotes WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as quotes,
  (SELECT COUNT(*) FROM invoices WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as invoices,
  (SELECT COUNT(*) FROM enquiries WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as enquiries;

-- Expected results:
-- clients: 7
-- jobs: 7
-- appointments: 7
-- quotes: 4
-- invoices: 6
-- enquiries: 4

-- ================================================
-- 🗑️ CLEANUP (Run After Screenshots)
-- ================================================
-- Run this AFTER you've taken your screenshots to remove all test data

-- DELETE FROM job_appointments WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
-- DELETE FROM invoices WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
-- DELETE FROM quotes WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
-- DELETE FROM enquiries WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
-- DELETE FROM jobs WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';
-- DELETE FROM clients WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2';

-- Verify all deleted (uncomment to run):
-- SELECT 
--   (SELECT COUNT(*) FROM clients WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as clients,
--   (SELECT COUNT(*) FROM jobs WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as jobs,
--   (SELECT COUNT(*) FROM job_appointments WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as appointments,
--   (SELECT COUNT(*) FROM quotes WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as quotes,
--   (SELECT COUNT(*) FROM invoices WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as invoices,
--   (SELECT COUNT(*) FROM enquiries WHERE user_id = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2') as enquiries;
-- All should be 0
