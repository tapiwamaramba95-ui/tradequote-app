# Jobs as Central Hub - Complete System Documentation

## 🎯 Overview

**MAJOR PARADIGM SHIFT**: Jobs are now the central hub of the entire TradeQuote system.

```
OLD FLOW: Enquiry → Quote → Job → Invoice
NEW FLOW: Job (enquiry status) → Quote → Work → Invoice
```

Everything now flows through Jobs. Every action, from initial enquiry to final invoice, is tracked on the Job record.

---

## 📊 Database Changes

### Migration File
**Location**: `db/migrations/20260306_jobs_as_central_hub.sql`

### Key Changes

#### 1. **Jobs Table** (Central Hub)
New columns added:
- `enquiry_source` - How they contacted you (phone, email, website, etc.)
- `enquiry_date` - When the enquiry was received
- `quoted_amount` - From latest accepted quote
- `invoiced_amount` - Sum of all invoices
- `paid_amount` - Sum of paid invoices
- Financial aggregates:
  - `total_material_cost`
  - `total_labour_cost`
  - `total_acquisition_cost` (M&Q time = CAC)
  - `total_subcontractor_cost`
  - `total_cost`
  - `gross_profit`
  - `margin` (percentage)

**Status workflow**:
```
enquiry → quoted → approved → in_progress → completed
```

#### 2. **Quotes Table**
- `job_id` now REQUIRED (quotes must belong to a job)
- `quote_version` - Auto-incremented (v1, v2, v3...)
- `is_accepted` - Boolean flag for accepted quotes

#### 3. **Invoices Table**
- `job_id` now REQUIRED (invoices must belong to a job)

#### 4. **Timesheet Entries** (Simplified)
**REMOVED**:
- `enquiry_id`
- `quote_id`
- `invoice_id`

**KEPT**:
- `job_id` (required for 'work' and 'measure_quote', optional for 'general_admin')

**Type values**:
- `'work'` - Billable work on job (was 'job')
- `'measure_quote'` - M&Q time on job (CAC tracking)
- `'general_admin'` - General overhead (was 'general')

**Note**: The database column is `event_type`, not `type`.

#### 5. **Job Appointments** (New Table)
Replaces separate M&Q scheduling:
```sql
CREATE TABLE job_appointments (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  user_id UUID REFERENCES profiles(id),
  appointment_type TEXT, -- 'measure_quote', 'work', 'follow_up'
  scheduled_date TIMESTAMP,
  duration_minutes INTEGER,
  address TEXT,
  notes TEXT,
  status TEXT, -- 'scheduled', 'completed', 'cancelled', 'no_show'
  created_at TIMESTAMP
)
```

### Auto-Calculation Triggers

#### 1. **calculate_job_totals(job_id)** - Master Function
Aggregates everything and updates job:
- Material costs from invoices
- Labour costs from timesheets (type = 'work')
- Acquisition costs from timesheets (type = 'measure_quote')
- Subcontractor costs from invoices
- Quoted/invoiced/paid amounts
- Gross profit and margin

#### 2. **trigger_job_totals_update()** - CASCADE
Automatically runs `calculate_job_totals()` when:
- Invoice created/updated/deleted
- Timesheet entry created/updated/deleted
- Quote created/updated

#### 3. **update_job_status()** - Smart Status Management
Auto-updates job status:
- Quote sent → status = 'quoted'
- Quote accepted → status = 'approved'
- First timesheet with type='work' → status = 'in_progress'

#### 4. **set_quote_version()** - Auto-Versioning
Auto-increments quote version numbers per job (v1, v2, v3...)

---

## 🚀 New User Flow

### 1. **Receive Enquiry**
**Action**: Create job from enquiry
**Page**: `/dashboard/jobs/new-enquiry`
**Result**: Job created with status = 'enquiry'

**What to capture**:
- Client (select existing or create new)
- Job name (e.g., "Kitchen Renovation")
- Job address
- Description (what they need)
- Enquiry source (phone, email, website, etc.)

### 2. **Schedule M&Q Appointment**
**Action**: From job detail page, click "📅 Schedule M&Q"
**Result**: Creates `job_appointment` with type = 'measure_quote'

### 3. **Do M&Q Site Visit**
**Action**: Clock in with type = 'measure_quote'
**Page**: `/dashboard/timesheets`
**Result**: Time tracked as acquisition cost (CAC) on job

### 4. **Create Quote**
**Action**: From job detail page, click "💰 Create Quote"
**Result**: Quote linked to job, auto-versioned

**Status change**: job.status → 'quoted'

### 5. **Quote Accepted**
**Action**: From job detail page, click "✅ Mark Quote Accepted"
**Result**: Quote marked as accepted

**Status change**: job.status → 'approved'

### 6. **Schedule Work**
**Action**: From job detail page, click "📅 Schedule Work"
**Result**: Creates `job_appointment` with type = 'work'

### 7. **Do Work**
**Action**: Clock in with type = 'work'
**Page**: `/dashboard/timesheets`
**Result**: Labour cost tracked on job

**Status change** (on first work timesheet): job.status → 'in_progress'

### 8. **Create Invoice**
**Action**: From job detail page, click "📄 Create Invoice"
**Result**: Invoice linked to job

**Triggers run**:
- Material costs from invoice items → job.total_material_cost
- Labour costs from timesheets → job.total_labour_cost
- Acquisition costs from M&Q timesheets → job.total_acquisition_cost
- **Gross profit calculated**: invoiced - total_costs
- **Margin calculated**: (gross_profit / invoiced) × 100

### 9. **Job Complete**
**Action**: From job detail page, click "✅ Mark Complete"
**Result**: job.status → 'completed'

All financial data aggregated and visible!

---

## 📱 Updated Pages

### 1. **New Enquiry Page**
**Location**: `app/dashboard/jobs/new-enquiry/page.tsx`

Creates job directly from enquiry (no separate enquiries table).

**Form fields**:
- Client dropdown (with "+ Add New Client" option)
- Job name
- Job address
- Description
- Enquiry source

### 2. **Job Detail Page** (Central Hub)
**Location**: `app/dashboard/jobs/[id]/page.tsx`

**Completely rewritten** to be the central command center:

**Header**:
- Job name + status badge
- Client name + address
- Enquiry source

**Quick Actions** (context-aware based on status):
- **Enquiry**: Schedule M&Q, Create Quote
- **Quoted**: Mark Quote Accepted, Create Revised Quote
- **Approved/In Progress**: Schedule Work, Clock In, Create Invoice
- **In Progress**: Mark Complete

**Financial Summary** (4 cards):
- Quoted amount
- Invoiced amount
- Total cost (with breakdown: materials, labour, M&Q)
- Profit (with margin %)

**Sections**:
- **Quotes**: All quotes with versions + acceptance status
- **Invoices**: All invoices with totals
- **Appointments**: M&Q and work appointments
- **Timesheets**: Time logged (shows last 5, link to view all)

### 3. **Timesheets Page** (Simplified)
**Location**: `app/dashboard/timesheets/page.tsx`

**Complete rewrite** - removed enquiry/quote selectors:

**Clock-In Form**:
1. Select job (dropdown of jobs)
2. Select what you're doing:
   - 🔨 Work (billable work on job)
   - 📏 Measure & Quote (M&Q for job)
   - 📋 General Admin (not job-specific)

**That's it!** No more separate enquiry/quote selection.

### 4. **Analytics Page** (Jobs-Based)
**Location**: `app/dashboard/analytics/page.tsx`

**Updated** to pull from jobs table instead of invoices:

**Metrics**:
- Total gross profit (sum of job.gross_profit)
- Average margin (avg of job.margin)
- Jobs with revenue
- Total jobs

**Cost Breakdown Pie Chart**:
- Materials (job.total_material_cost)
- Labour (job.total_labour_cost)
- Acquisition (job.total_acquisition_cost)
- Subcontractors (job.total_subcontractor_cost)

**Most Profitable Jobs**:
Top 10 jobs by gross profit (pre-calculated on job record)

---

## 🔑 Key Principles

### 1. **Everything Happens on a Job**
No more separate enquiries. Jobs start at "enquiry" status and progress through workflow.

### 2. **Job is the Aggregator**
All financial data rolls up to the job level via database triggers:
- Material costs from invoice line items
- Labour costs from timesheets (type='work')
- Acquisition costs from timesheets (type='measure_quote')
- All invoiced amounts

###  3. **Timesheets = Job + Type**
Simplified clock-in:
- Which job? → Select from dropdown
- What are you doing? → work / measure_quote / general_admin

### 4. **Status Drives UI**
Job detail page shows different actions based on status:
```
enquiry     → Schedule M&Q, Create Quote
quoted      → Accept Quote, Revise Quote
approved    → Schedule Work, Clock In, Invoice
in_progress → Continue Work, Invoice, Complete
completed   → View-only
```

### 5. **Automatic Calculations**
No manual entry needed:
- Costs auto-calculate from timesheets and invoices
- Profit = invoiced - costs
- Margin = (profit / invoiced) × 100
- CAC = sum of measure_quote timesheets per job

---

## 🧪 Testing Checklist

### Database Setup
- [ ] Run migration: `20260306_jobs_as_central_hub.sql`
- [ ] Verify jobs table has new columns
- [ ] Verify job_appointments table created
- [ ] Verify triggers created (5 functions + 3 triggers)

### 1. **Enquiry to Job Flow**
- [ ] Navigate to `/dashboard/jobs/new-enquiry`
- [ ] Create job from enquiry
- [ ] Verify job created with status='enquiry'
- [ ] Verify enquiry_source captured

### 2. **Job Detail Page**
- [ ] Navigate to job detail page
- [ ] Verify financial summary shows (all $0.00 initially)
- [ ] Verify status badge shows "Enquiry"
- [ ] Verify "Schedule M&Q" and "Create Quote" buttons visible

### 3. **M&Q Flow**
- [ ] Click "Schedule M&Q" (should redirect to schedule page)
- [ ] Create M&Q appointment
- [ ] Navigate to timesheets page
- [ ] Clock in with type='measure_quote' for the job
- [ ] Work for some time, clock out
- [ ] Return to job detail page
- [ ] **Verify**: Total Cost shows M&Q cost
- [ ] **Verify**: Total Acquisition Cost populated

### 4. **Quote Flow**
- [ ] From job detail, click "Create Quote"
- [ ] Create quote (should auto-link to job)
- [ ] Mark quote as sent
- [ ] Return to job detail page
- [ ] **Verify**: Status changed to "quoted"
- [ ] **Verify**: Quoted Amount populated
- [ ] Click "Mark Quote Accepted"
- [ ] **Verify**: Status changed to "approved"
- [ ] **Verify**: Quote shows "ACCEPTED" badge

### 5. **Work Flow**
- [ ] From job detail (approved status), click "Schedule Work"
- [ ] Create work appointment
- [ ] Click "Clock In"
- [ ] Select the job, type='work'
- [ ] Work for some time, clock out
- [ ] Return to job detail page
- [ ] **Verify**: Status changed to "in_progress"
- [ ] **Verify**: Labour Cost populated
- [ ] **Verify**: Time logged shows in timesheets section

### 6. **Invoice Flow**
- [ ] From job detail, click "Create Invoice"
- [ ] Add line items with costs
- [ ] Save invoice
- [ ] Return to job detail page
- [ ] **Verify**: Invoiced Amount populated
- [ ] **Verify**: Material Cost populated (from line items)
- [ ] **Verify**: Gross Profit calculated
- [ ] **Verify**: Margin % shown
- [ ] **Verify**: Cost breakdown shows materials, labour, M&Q

### 7. **Multiple Quotes/Invoices**
- [ ] Create revised quote (v2) for same job
- [ ] **Verify**: Quote version increments
- [ ] Create second invoice for same job
- [ ] **Verify**: Invoiced Amount = sum of both invoices
- [ ] **Verify**: Gross Profit accurately calculated

### 8. **Complete Job**
- [ ] From job detail (in_progress status), click "Mark Complete"
- [ ] **Verify**: Status changed to "completed"
- [ ] Navigate to Analytics page
- [ ] **Verify**: Job appears in "Most Profitable Jobs"
- [ ] **Verify**: Cost breakdown includes this job's costs

### 9. **Analytics Dashboard**
- [ ] Navigate to `/dashboard/analytics`
- [ ] **Verify**: Total Gross Profit shows sum of all jobs
- [ ] **Verify**: Average Margin calculated
- [ ] **Verify**: Cost Breakdown pie chart displays
- [ ] **Verify**: Quote Win Rate calculated (accepted / total)
- [ ] **Verify**: Average CAC calculated correctly
- [ ] **Verify**: Most Profitable Jobs table populated

### 10. **General Admin Time**
- [ ] Navigate to timesheets
- [ ] Clock in with type='general_admin' (no job required)
- [ ] Clock out
- [ ] **Verify**: Entry saved without job_id
- [ ] **Verify**: Does NOT affect any job's costs

---

## 🔧 TypeScript Types

Updated types in `lib/types.ts`:

### Job Interface
```typescript
export interface Job {
  id: string
  user_id: string
  client_id: string
  job_name: string
  job_address: string
  description?: string
  status: 'enquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  enquiry_source?: string
  enquiry_date?: string
  quoted_amount?: number
  invoiced_amount?: number
  paid_amount?: number
  total_material_cost?: number
  total_labour_cost?: number
  total_acquisition_cost?: number
  total_subcontractor_cost?: number
  total_cost?: number
  gross_profit?: number
  margin?: number
  created_at: string
  client?: {
    id: string
    name: string
    email: string
  }
}
```

### JobAppointment Interface
```typescript
export interface JobAppointment {
  id: string
  job_id: string
  user_id: string
  appointment_type: 'measure_quote' | 'work' | 'follow_up'
  scheduled_date: string
  duration_minutes?: number
  address?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  created_at: string
}
```

### TimesheetEntry (Simplified)
```typescript
export interface TimesheetEntry {
  id: string
  user_id: string
  staff_member_id: string
  job_id?: string // Required for 'work' and 'measure_quote'
  event_type: 'work' | 'measure_quote' | 'general_admin' // Database column
  date: string
  start_time: string
  end_time: string
  total_hours: number
  hourly_cost?: number
  total_cost?: number
  created_at: string
}
```

**Note**: The database uses `event_type` as the column name.

---

## 📈 Benefits of This Architecture

### 1. **Simpler User Experience**
- One place to see everything (job detail page)
- Natural workflow (enquiry → quote → work → invoice)
- Context-aware actions (only show what's relevant)

### 2. **Accurate Profitability**
- Real-time cost tracking
- Automatic profit/margin calculations
- CAC properly allocated to each job

### 3. **Better Reporting**
- All data aggregated at job level
- Easy to query most profitable jobs
- Source tracking (which enquiry source converts best)

### 4. **Scalability**
- Database triggers handle calculations
- No manual aggregation needed
- Consistent data (single source of truth)

### 5. **Data Integrity**
- Enforced relationships (invoices must have jobs)
- Cascade updates (change invoice → job auto-updates)
- Status workflow prevents invalid states

---

## 🚨 Migration Notes

### From Old System

If migrating from the previous enquiries-based system:

1. **Run migration script** - handles schema changes
2. **Existing enquiries** - can be converted to jobs with status='enquiry'
3. **Existing quotes/invoices** - should already have job_id (verify!)
4. **Timesheet entries** - migration removes old enquiry_id/quote_id columns
5. **Type migration** - 'job' → 'work', 'general' → 'general_admin'

### Breaking Changes
- ❌ Enquiries table no longer used (can be dropped after migration)
- ❌ Timesheet entries no longer link to enquiries/quotes directly
- ❌ Schedule events remain separate (could be migrated to job_appointments later)

---

## 💡 Tips & Best Practices

### 1. **Always Track M&Q Time**
- Clock in as 'measure_quote' when doing site visits
- This gives you accurate CAC per job
- Helps identify which jobs are worth pursuing

### 2. **Accept Quotes in System**
- Don't forget to mark quotes as accepted
- This triggers status updates and reporting

### 3. **Complete Jobs When Done**
- Mark jobs as complete for accurate reporting
- Completed jobs show in profitability analytics

### 4. **Use Job Numbers**
- Jobs auto-generate job numbers
- Use these for easy reference with clients

### 5. **Link Everything**
- All quotes should have job_id
- All invoices should have job_id
- All timesheets (except general admin) should have job_id

---

## 🆘 Troubleshooting

### Issue: Job costs not calculating
**Check**:
1. Timesheet entries have job_id
2. Timesheet entries have correct event_type ('work' or 'measure_quote')
3. Staff members have hourly_rate set
4. Triggers are installed correctly

### Issue: Quoted amount not showing
**Check**:
1. Quote has job_id
2. Quote is marked as accepted OR is latest version
3. calculate_job_totals trigger ran successfully

### Issue: Profit showing incorrectly
**Check**:
1. Invoice has job_id
2. Invoice line items have costs
3. Material costs populated on invoice
4. Triggers ran (check invoices.material_cost populated)

### Issue: Job status not updating
**Check**:
1. Quote status set correctly
2. update_job_status trigger installed
3. Check trigger execution logs

---

## 📞 Support

For issues or questions about the Jobs as Central Hub system:

1. Check this documentation first
2. Verify database migration ran successfully
3. Check browser console for errors
4. Verify triggers are installed: `SELECT * FROM pg_trigger WHERE tgname LIKE '%job%'`

---

**Last Updated**: March 6, 2026
**Migration File**: `20260306_jobs_as_central_hub.sql`
**Status**: ✅ Complete & Ready for Testing
