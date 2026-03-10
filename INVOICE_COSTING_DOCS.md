# Invoice Costing & Margin Tracking System - Documentation

**Created:** March 6, 2026  
**Status:** ✅ Complete & Ready for Testing  
**System:** TradeQuote - Cost tracking and profitability analysis

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Auto-Calculation Triggers](#auto-calculation-triggers)
4. [Feature Updates](#feature-updates)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Testing Checklist](#testing-checklist)
7. [Production TODO](#production-todo)

---

## Overview

### What Was Built

A comprehensive invoice costing and margin tracking system that:

- ✅ **Tracks costs at invoice level** (not job level - invoices can exist without jobs)
- ✅ **Auto-calculates costs** from price lists, labour rates, and timesheets
- ✅ **Proportionally allocates CAC** (Customer Acquisition Cost) when a job has multiple invoices
- ✅ **Shows real-time profitability** on invoice detail pages
- ✅ **Analytics dashboard** with margin insights, cost breakdown, and profitable job rankings
- ✅ **Enhanced timesheet tracking** with enquiry, quote, and labour rate selection

### Key Innovation

**Proportional CAC Allocation**: When a job has multiple invoices, the M&Q (Measure & Quote) time cost is split proportionally based on each invoice's revenue percentage. This ensures accurate profit margins per invoice.

**Example:**
- Job has 2 invoices: $10,000 and $5,000 (total $15,000)
- M&Q time cost: $300
- Invoice 1 CAC: $200 (66.7% of revenue)
- Invoice 2 CAC: $100 (33.3% of revenue)

---

## Database Schema

### New Tables

#### **enquiries**
```sql
- id (UUID, primary key)
- user_id (UUID → profiles.id)
- client_id (UUID → clients.id)
- enquiry_source (text: 'phone', 'email', 'website', 'referral', 'walk-in')
- description (text)
- status (text: 'new', 'quoted', 'won', 'lost')
- created_at, updated_at (timestamps)
```

### Updated Tables

#### **quotes**
New columns:
- `enquiry_id` → enquiries.id
- `job_id` → jobs.id
- `total_quote_hours` (decimal) - Sum of M&Q timesheet hours
- `total_quote_cost` (decimal) - Sum of M&Q timesheet costs

#### **timesheet_entries**
New columns:
- `enquiry_id` → enquiries.id
- `quote_id` → quotes.id
- `invoice_id` → invoices.id (optional - link timesheet to specific invoice)
- `hourly_cost` (decimal) - Cost per hour for this timesheet (from staff member's hourly_rate)
- `total_cost` (decimal) - AUTO-CALCULATED: hours × hourly_cost

#### **invoice_line_items**
New columns:
- `supplier_product_id` → supplier_products.id (if table exists)
- `labour_rate_id` → labour_rates.id (optional - for manually added labour line items)
- `line_item_type` (text: 'material', 'labour', 'custom')
- `unit_price` (decimal) - What client pays per unit
- `line_total` (decimal) - What client pays total
- `unit_cost` (decimal) - AUTO-CALCULATED from price list/labour rate
- `line_cost` (decimal) - AUTO-CALCULATED: unit_cost × quantity
- `line_profit` (decimal) - AUTO-CALCULATED: line_total - line_cost
- `line_margin` (decimal) - AUTO-CALCULATED: (line_profit / line_total) × 100

**Note:** Labour costs primarily come from timesheets (staff hourly rates), but you can also manually add labour line items that reference labour_rates.

#### **invoices**
New columns:
- `material_cost` (decimal) - Sum of material line costs
- `labour_cost` (decimal) - Sum of labour costs from timesheets
- `acquisition_cost` (decimal) - Proportional CAC allocation
- `subcontractor_cost` (decimal) - Manual entry
- `other_costs` (decimal) - Manual entry
- `total_cost` (decimal) - AUTO-CALCULATED: sum of all costs
- `gross_profit` (decimal) - AUTO-CALCULATED: total - total_cost
- `margin` (decimal) - AUTO-CALCULATED: (gross_profit / total) × 100

#### **labour_rates**
New column:
- `cost_per_hour` (decimal) - What it costs YOU (optional, defaults to hourly_rate if not set)

---

## Auto-Calculation Triggers

### 1. `calculate_timesheet_cost()`
**Fires:** BEFORE INSERT OR UPDATE on `timesheet_entries`

**Logic:**
1. Look up staff member's `hourly_rate` from `staff` table using `staff_member_id`
2. Set `hourly_cost = staff.hourly_rate`
3. Calculate: `total_cost = total_hours × hourly_cost`

**Result:** Every timesheet entry automatically gets its cost calculated from the staff member's rate.

---

### 2. `update_quote_costs_from_timesheets()`
**Fires:** AFTER INSERT OR UPDATE OR DELETE on `timesheet_entries`

**Logic:**
1. Sum all M&Q timesheet hours for the quote
2. Sum all M&Q timesheet costs for the quote
3. Update quote's `total_quote_hours` and `total_quote_cost`

**Result:** Quotes always show accurate M&Q time and cost.

---

### 3. `calculate_line_item_costs()`
**Fires:** BEFORE INSERT OR UPDATE on `invoice_line_items`

**Logic:**
1. **If `supplier_product_id` is set:**
   - Fetch `price` from supplier_products
   - Set `unit_cost = price`
   - Set `line_item_type = 'material'`

2. **If `labour_rate_id` is set:**
   - Fetch `cost_per_hour` from labour_rates
   - Set `unit_cost = cost_per_hour`
   - Set `line_item_type = 'labour'`

3. **Calculate profitability:**
   - `line_cost = unit_cost × quantity`
   - `line_profit = line_total - line_cost`
   - `line_margin = (line_profit / line_total) × 100`

**Result:** Every line item automatically calculates its cost and margin.

---

### 4. `calculate_invoice_total_costs()`
**Function (not trigger):** Called by other triggers

**Logic:**
1. **Material Cost:**
   - Sum `line_cost` from all line items with `line_item_type = 'material'`

2. **Labour Cost:**
   - Option A: Sum `total_cost` from timesheets with `type = 'job'`
   - Option B: Sum `line_cost` from line items with `line_item_type = 'labour'`
   - Uses whichever is greater (prefers timesheets if job exists)

3. **Acquisition Cost (CAC):**
   - **If job has multiple invoices:**
     - Calculate total job revenue (sum all invoice totals)
     - Calculate total job CAC (sum all M&Q timesheet costs)
     - Allocate proportionally: `(this_invoice_total / job_total) × job_cac`
   - **If no job or single invoice:**
     - Use M&Q timesheets directly linked to invoice

4. **Update invoice totals:**
   ```sql
   total_cost = material_cost + labour_cost + acquisition_cost + subcontractor_cost + other_costs
   gross_profit = total - total_cost
   margin = (gross_profit / total) × 100
   ```

**Result:** Complete invoice profitability calculated automatically.

---

### 5. `trigger_update_invoice_costs()`
**Fires:** AFTER INSERT OR UPDATE OR DELETE on `invoice_line_items` and `timesheet_entries`

**Logic:**
1. Detect which invoice(s) are affected
2. Call `calculate_invoice_total_costs()` for each invoice
3. CASCADE: When timesheets change, update all invoices for that job

**Result:** Invoices always reflect current cost data in real-time.

---

## Feature Updates

### 1. Timesheet Clock-In Flow
**File:** `app/dashboard/timesheets/page.tsx`

**New Features:**
- ✅ **Enquiry selection** when clock-in type is 'measure_quote'
- ✅ **Quote selection** (optional) - shown after enquiry selected, loads quotes for that enquiry
- ✅ **Costs auto-calculated** from staff member's hourly rate (set in staff settings)

**User Experience:**
1. Select work type: Job / M&Q / General
2. If Job → Select job
3. If M&Q → Select enquiry → optional quote
4. Clock in → costs auto-calculated from staff member's rate when clock out

**Data Flow:**
```
Clock In → active_shifts (stores enquiry_id, quote_id)
         ↓
Clock Out → timesheet_entries (copies IDs, auto-calculates costs from staff.hourly_rate via trigger)
          ↓
        Triggers cascade update to quotes and invoices
```

---

### 2. Analytics Dashboard
**File:** `app/dashboard/analytics/page.tsx`  
**Route:** `/dashboard/analytics`

**Sections:**

#### **Profit & Margin Metrics** (3 cards)
- Total Gross Profit (sum across all invoices with cost data)
- Average Margin (color-coded: green > 30%, yellow > 15%, red < 15%)
- Invoices with Cost Data (percentage of total)

#### **Cost Breakdown** (Pie Chart)
- Materials, Labour, Acquisition, Subcontractors
- Interactive tooltips with dollar amounts
- Shows proportional cost distribution

#### **Customer Acquisition Cost** (2 metrics)
- Average CAC per Job (M&Q time per job)
- Quote Win Rate (accepted quotes ÷ total quotes × 100)
- Tips for improving CAC efficiency

#### **Most Profitable Jobs** (Table - top 10)
Columns:
- Job # | Title | Revenue | Cost | Profit | Margin % | Invoice Count

Sorted by: Gross profit (descending)

**Dependencies:**
- Recharts (installed: `npm install recharts @types/recharts`)

---

### 3. Invoice Detail Page Enhancements
**File:** `app/dashboard/invoices/[id]/page.tsx`

**New Section: "Profit & Margin Analysis"**

Shown when `invoice.total_cost` is not null:

**Row 1: Cost Breakdown (4 cards)**
- Material Cost
- Labour Cost
- Acquisition Cost (with "M&Q time" note)
- Subcontractor Cost

**Row 2: Profit Summary (3 cards)**
- Total Cost (red)
- Gross Profit (green/red based on positive/negative)
- Profit Margin % (color-coded with emojis: 🎯 Excellent / 📊 Good / ⚠️ Below target)

**Row 3: Revenue vs Cost**
- Revenue (Invoice Total): $X
- Total Costs: -$Y
- Net Profit: $Z

**Info Box:**
- Explains how margin tracking works
- Bullet points for each cost source

**Fallback (No Cost Data):**
- Yellow warning box explaining cost data not available yet
- Checklist: Link to supplier products, log timesheets, track M&Q time
- Link to Analytics Dashboard

---

## Testing Checklist

### ✅ Phase 1: Database Migration

- [ ] Run migration: `db/migrations/20260306_invoice_costing_margin_tracking.sql`
- [ ] Verify tables:
  - [ ] `enquiries` table created
  - [ ] All new columns added to existing tables
  - [ ] All 5 triggers created successfully
- [ ] Test RLS:
  - [ ] Users can only see their own enquiries
  - [ ] Triggers run with correct permissions

**SQL Test Queries:**
```sql
-- Verify enquiries table
SELECT * FROM enquiries LIMIT 1;

-- Verify new columns in timesheet_entries
SELECT id, enquiry_id, quote_id, labour_rate_id, hourly_cost, total_cost 
FROM timesheet_entries LIMIT 1;

-- Verify triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table IN ('timesheet_entries', 'invoice_line_items', 'quotes');
```

---

### ✅ Phase 2: Timesheet Clock-In

1. **Create Test Data:**
   - [ ] Create an enquiry (new table)
   - [ ] Create a quote linked to that enquiry
   - [ ] Ensure staff member has `hourly_rate` set in staff table

2. **Test Clock-In Flow:**
   - [ ] Clock in for "Job" → Select job
   - [ ] Clock in for "M&Q" → Select enquiry → Quote dropdown appears
   - [ ] Clock in for "M&Q" → Select quote from dropdown

3. **Test Clock-Out & Cost Calculation:**
   - [ ] Clock out after 2 hours
   - [ ] Verify timesheet entry has `hourly_cost` populated (from staff member's rate)
   - [ ] Verify `total_cost = total_hours × hourly_cost`
   - [ ] If M&Q type: Verify quote's `total_quote_cost` updated

**Expected Result:**
- Timesheet entry automatically calculates cost based on labour rate
- Quote costs update instantly when M&Q time is logged

---

### ✅ Phase 3: Invoice Cost Calculation

1. **Create Invoice with Line Items:**
   - [ ] Create invoice for a job
   - [ ] Add line items (materials)
   - [ ] Verify line items don't have costs yet (no supplier_product_id linked)

2. **Link to Price List:**
   - [ ] If `supplier_products` table exists:
     - [ ] Update line item to have `supplier_product_id`
     - [ ] Verify `unit_cost` auto-populates from price list
     - [ ] Verify `line_cost`, `line_profit`, `line_margin` calculate

3. **Link Timesheets to Job:**
   - [ ] Ensure staff member has hourly_rate set
   - [ ] Log timesheet against the job
   - [ ] Check invoice: `labour_cost` should update automatically
   - [ ] Verify `total_cost` includes labour

4. **Test CAC Allocation:**
   - [ ] Log M&Q timesheet for the job
   - [ ] Check invoice: `acquisition_cost` should appear
   - [ ] Create 2nd invoice for same job
   - [ ] Verify CAC splits proportionally between invoices

**Expected Result:**
- Invoice costs update in real-time as timesheets/line items change
- Margin % displays correctly on invoice detail page

---

### ✅ Phase 4: Analytics Dashboard

1. **Navigate to `/dashboard/analytics`:**
   - [ ] Page loads without errors
   - [ ] All metrics display (even if zero)

2. **Test Metrics with Data:**
   - [ ] Create multiple invoices with cost data
   - [ ] Verify Total Gross Profit = sum of all invoice profits
   - [ ] Verify Average Margin calculates correctly
   - [ ] Verify pie chart shows cost breakdown

3. **Test Most Profitable Jobs Table:**
   - [ ] Create jobs with multiple invoices
   - [ ] Verify table shows top 10 by profit
   - [ ] Verify revenue, cost, profit, margin columns accurate

4. **Test Quote Win Rate:**
   - [ ] Create quotes with different statuses
   - [ ] Verify win rate = (accepted quotes / total) × 100

**Expected Result:**
- Dashboard provides actionable insights
- Charts render correctly (Recharts library)
- All numbers match database state

---

### ✅ Phase 5: Invoice Detail Page

1. **View Invoice with Cost Data:**
   - [ ] Open invoice that has `total_cost` populated
   - [ ] "Profit & Margin Analysis" section appears
   - [ ] All 4 cost types display correctly
   - [ ] Profit summary shows accurate totals
   - [ ] Margin % color-coded correctly (green/yellow/red)

2. **View Invoice without Cost Data:**
   - [ ] Open invoice with `total_cost = null`
   - [ ] Yellow warning box appears
   - [ ] Checklist explains how to enable margin tracking
   - [ ] Link to analytics dashboard works

**Expected Result:**
- Users see profitability instantly on invoice page
- Clear guidance when cost data is missing

---

### ✅ Phase 6: End-to-End Flow

**Complete Business Workflow:**

1. **Lead comes in:**
   - [ ] Create enquiry (new customer inquiry)

2. **M&Q work** (measure & quote):
   - [ ] Clock in for M&Q type → select enquiry
   - [ ] Work 2 hours on measure & quote
   - [ ] Clock out → M&Q cost recorded (from staff hourly rate)

3. **Create Quote:**
   - [ ] Create quote linked to enquiry
   - [ ] Quote shows M&Q hours and cost

4. **Win Job:**
   - [ ] Convert quote to job
   - [ ] Update quote status to 'accepted'

5. **Work on Job:**
   - [ ] Clock in for Job type → select job
   - [ ] Work 8 hours
   - [ ] Clock out → labour cost recorded (from staff hourly rate)

6. **Create Invoice:**
   - [ ] Create invoice for job
   - [ ] Add line items from price list (material costs)
   - [ ] View invoice detail page

7. **Verify Profitability:**
   - [ ] Invoice shows all 4 cost types:
     - Material cost (from line items)
     - Labour cost (from job timesheets)
     - Acquisition cost (from M&Q time, proportionally allocated)
     - Subcontractor cost (if any)
   - [ ] Gross profit and margin % calculate correctly
   - [ ] Analytics dashboard updates with new data

**Expected Result:**
- Complete visibility from enquiry to invoice profitability
- All costs auto-calculated with no manual data entry
- Accurate margin tracking ensures business sustainability

---

## Production TODO

### 🔧 Before Launch

1. **Database Migration:**
   - [ ] Run migration on staging environment first
   - [ ] Backup production database before migration
   - [ ] Run migration during low-traffic window
   - [ ] Verify all triggers created successfully

2. **Historical Data:**
   - [ ] Decide: Backfill enquiries from existing quotes?
   - [ ] Migrate existing timesheets to new structure?
   - [ ] Set default labour rates for staff?

3. **Business Settings:**
   - [ ] Ensure all staff members have `hourly_rate` set in staff table
   - [ ] Link supplier products to price list (if table exists)
   - [ ] Train users on M&Q timesheet tracking

4. **Performance:**
   - [ ] Test trigger performance with large datasets
   - [ ] Add indexes if queries slow
   - [ ] Consider materialized views for analytics dashboard

5. **Testing:**
   - [ ] Run full test suite on staging
   - [ ] Test CASCADE updates with 100+ invoices per job
   - [ ] Load test analytics page with 1000+ invoices

---

### 📊 Post-Launch Monitoring

1. **Data Quality:**
   - Monitor % of invoices with cost data
   - Alert if margin calculations seem off
   - Check for null costs that should be populated

2. **User Adoption:**
   - Track how many staff have hourly_rate set
   - Monitor M&Q time tracking (acquisition costs)
   - Encourage price list linkage for materials

3. **Performance:**
   - Monitor trigger execution time
   - Check analytics dashboard load time
   - Optimize if queries exceed 2 seconds

---

### 🎯 Future Enhancements

1. **Advanced Analytics:**
   - Margin trends over time (line chart)
   - Cost breakdown by client/trade type
   - Profit per staff member

2. **Bulk Operations:**
   - Bulk link line items to price list
   - Migrate old timesheets to cost-enabled structure
   - Set hourly rates for all staff members

3. **Integrations:**
   - Export cost data to accounting software (Xero, QuickBooks)
   - Automated alerts for low-margin invoices
   - Compare actual costs vs quoted costs

4. **Mobile App:**
   - Clock in/out with automatic labour rate selection
   - Real-time margin visibility on mobile
   - Push notifications for cost anomalies

---

## Summary

### What This System Enables

✅ **Complete Cost Visibility:** Track materials, labour, CAC, and subcontractors at invoice level

✅ **Real-Time Profitability:** Know your margin before you send the invoice

✅ **Accurate CAC Allocation:** Fair distribution of M&Q costs across multiple invoices

✅ **Business Intelligence:** Analytics dashboard shows which jobs/clients are most profitable

✅ **Automated Calculations:** No manual data entry - triggers handle everything

✅ **Actionable Insights:** Identify low-margin work and improve pricing strategy

### Key Business Value

- **Pricing Optimization:** See actual costs vs revenue to adjust quotes
- **Resource Allocation:** Identify which jobs/clients are worth the time
- **Profitability Tracking:** Monitor margin trends across all work
- **Cost Control:** Spot cost overruns before they hurt profit
- **Strategic Planning:** Use historical margin data to grow intelligently

---

**System Status:** ✅ Complete & Ready for Testing  
**Next Step:** Run Phase 1 testing checklist (database migration)  
**Support:** Check inline code comments for implementation details
