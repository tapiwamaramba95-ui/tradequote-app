// =====================================================
// SCHEDULE & TIMESHEET TYPES
// TypeScript interfaces for schedule events and M&Q timesheets
// =====================================================

export type ScheduleEventType = 'measure_quote' | 'scheduled_work' | 'admin'
export type TimesheetEventType = 'work' | 'measure_quote' | 'general_admin'
export type ClockInType = 'work' | 'measure_quote' | 'general_admin'

// =====================================================
// SCHEDULE EVENT INTERFACES
// =====================================================

export interface ScheduleEvent {
  id: string
  user_id: string
  event_type: ScheduleEventType
  title?: string
  scheduled_date: string
  scheduled_time?: string
  duration_minutes?: number
  staff_id?: string
  job_id?: string
  enquiry_id?: string
  notes?: string
  created_at: string
  
  // Joined data from related tables
  jobs?: { 
    job_name: string
    id: string 
  }
  enquiries?: { 
    id: string
    job_name: string
    description: string 
  }
  staff?: { 
    name: string 
  }
}

// =====================================================
// TIMESHEET INTERFACES  
// =====================================================

export interface TimesheetEntry {
  id: string
  user_id: string
  staff_member_id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  entry_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  
  // Foreign key references
  job_id?: string // For 'work' type
  enquiry_id?: string // For 'measure_quote' type
  event_type: 'work' | 'measure_quote' | 'general_admin' // Database column name
  
  // Costing fields (auto-calculated by triggers from staff member's hourly rate)
  hourly_cost?: number
  total_cost?: number
  
  // Joined data from related tables
  jobs?: { 
    job_name: string
    status: string
  }
  enquiries?: {
    enquiry_number: string
    name: string
  }
}

export interface ActiveShift {
  id: string
  user_id: string
  staff_member_id: string
  clock_in_time: string
  job_id?: string // For 'work' type
  enquiry_id?: string // For 'measure_quote' type
  event_type: 'work' | 'measure_quote' | 'general_admin' // Database column name
  created_at: string
  
  // Joined data
  jobs?: { 
    job_name: string
    status: string
  }
  enquiries?: {
    enquiry_number: string
    name: string
  }
}

// =====================================================
// CALENDAR APPOINTMENT (updated for new system)
// =====================================================

export interface Appointment {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  jobId?: string
  enquiryId?: string
  eventType?: ScheduleEventType
}

// =====================================================
// JOB APPOINTMENT INTERFACE (schedule M&Q or work)
// =====================================================

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
  
  // Joined data
  jobs?: {
    job_name: string
    job_address: string
  }
}

// =====================================================
// JOB INTERFACE (CENTRAL HUB - all data aggregates here)
// =====================================================

export interface Job {
  id: string
  user_id: string
  client_id: string
  job_number?: string
  enquiry_number?: string
  job_name: string
  job_address?: string // Legacy field, now optional
  title?: string
  street_address?: string | null
  suburb?: string | null
  state?: string | null
  postcode?: string | null
  description?: string
  staff_member_id?: string
  
  // Status workflow: enquiry → quoted → approved → in_progress → completed
  status: 'enquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  
  // Enquiry info
  enquiry_source?: string
  enquiry_date?: string
  
  // Financial aggregates
  quoted_amount?: number
  invoiced_amount?: number
  paid_amount?: number
  
  // Cost aggregates
  total_material_cost?: number
  total_labour_cost?: number
  total_acquisition_cost?: number // M&Q time (CAC)
  total_subcontractor_cost?: number
  total_other_costs?: number
  total_cost?: number
  
  // Profit
  gross_profit?: number
  margin?: number
  
  created_at: string
  
  // Joined data
  client?: {
    id: string
    name: string
    email: string
  }
}

// =====================================================
// QUOTE INTERFACE (versioned per job)
// =====================================================

export interface Quote {
  id: string
  user_id: string
  client_id: string
  job_id: string // REQUIRED - quote must have a job
  quote_number: string
  quote_version?: number // Auto-incremented per job (v1, v2, v3...)
  is_accepted?: boolean
  status: string
  total?: number
  total_quote_hours?: number
  total_quote_cost?: number
  created_at: string
  
  // Joined data
  jobs?: {
    job_name: string
    status: string
  }
}

// =====================================================
// LABOUR RATE INTERFACE (for cost tracking)
// =====================================================

export interface LabourRate {
  id: string
  user_id: string
  title: string
  hourly_rate: number
  cost_per_hour?: number
  created_at: string
}

// =====================================================
// HELPER TYPE UTILITIES
// =====================================================

export type DatabaseTables = {
  schedule_events: ScheduleEvent
  timesheet_entries: TimesheetEntry
  active_shifts: ActiveShift
  jobs: Job
  job_appointments: JobAppointment
  quotes: Quote
}

// For Supabase query building
export type ScheduleEventWithJoins = ScheduleEvent & {
  jobs: Job | null
}

export type TimesheetEntryWithJoins = TimesheetEntry & {
  jobs: Job | null
}
// =====================================================
// ENHANCED TYPES FOR DASHBOARD OPTIMIZATION
// =====================================================

// Dashboard stats type (from materialized view)
export type DashboardStats = {
  outstanding_revenue: number
  unpaid_invoice_count: number
  jobs_today: number
  overdue_invoices_count: number
  expiring_quotes_count: number
  invoices_draft: number
  invoices_unpaid: number
  invoices_overdue: number
  invoices_paid: number
  quotes_draft: number
  quotes_sent: number
  quotes_accepted: number
  quotes_declined: number
  pos_draft: number
  pos_unbilled: number
  pos_billed: number
  last_updated: string
}

// Dashboard action item
export type ActionItem = {
  id: string
  type: 'invoice' | 'quote' | 'job'
  urgency: 'urgent' | 'warning' | 'info'
  title: string
  subtitle: string
  amount?: number
  entityId: string
  daysOverdue?: number
  invoice_number?: string
  quote_number?: string
  job_number?: string
  client_id?: string
  client_name?: string
}

// =====================================================
// EXTENDED JOB TYPES
// =====================================================

// Job with client relationship
export type JobWithClient = Job & {
  client: {
    id: string
    name: string
    email: string
    phone: string
    address?: string
  } | null
}

// Job with full relationships
export type JobWithRelations = Job & {
  client: {
    id: string
    name: string
    email: string
    phone: string
  } | null
  quotes: Quote[]
  invoices: Array<{
    id: string
    invoice_number: string
    total: number
    status: string
    created_at: string
  }>
  appointments: JobAppointment[]
}

