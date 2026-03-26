/**
 * Types for the Recurring Jobs system
 * Supports auto-generating job instances on flexible schedules
 */

export type RecurringFrequency = 
  | 'daily'
  | 'weekly' 
  | 'fortnightly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom'

export type RecurringEndType = 'never' | 'after_occurrences' | 'on_date'

export type InvoiceTiming = 
  | 'on_completion'      // Invoice each instance when completed
  | 'on_schedule'        // Invoice on scheduled date regardless of completion
  | 'batch_monthly'      // One invoice per month for all instances
  | 'batch_quarterly'    // One invoice per quarter for all instances

export type RecurringJobStatus = 'active' | 'paused' | 'cancelled' | 'completed'

export type RecurringJobAction = 'created' | 'paused' | 'resumed' | 'edited' | 'cancelled' | 'completed'

export type LineItem = {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

export type RecurringJob = {
  id: string
  business_id: string
  
  // Template
  title: string
  description?: string
  client_id: string
  street_address?: string
  suburb?: string
  state?: string
  postcode?: string
  staff_member_id?: string
  assigned_connection_id?: string
  line_items: LineItem[]
  
  // Schedule
  frequency: RecurringFrequency
  interval_count: number
  days_of_week?: number[] // [1,4] = Mon, Thu (1=Mon, 7=Sun)
  day_of_month?: number   // 1-31, or -1 for last day
  month_of_year?: number  // 1-12
  
  start_date: string
  end_type: RecurringEndType
  end_after_occurrences?: number
  end_date?: string
  
  // Settings
  generate_ahead_weeks: number
  last_generated_date?: string
  
  auto_invoice: boolean
  invoice_timing?: InvoiceTiming
  invoice_batch_day?: number
  
  // Status
  status: RecurringJobStatus
  paused_at?: string
  cancelled_at?: string
  
  created_by?: string
  created_at: string
  updated_at: string
}

export type RecurringJobHistory = {
  id: string
  recurring_job_id: string
  action: RecurringJobAction
  changes?: Record<string, any>
  affected_instances?: number
  performed_by?: string
  performed_at: string
}

export type RecurringInvoiceBatch = {
  id: string
  recurring_job_id: string
  invoice_id: string
  job_instance_ids: string[]
  instance_count: number
  batch_period_start: string
  batch_period_end: string
  created_at: string
}

export type RecurringJobWithRelations = RecurringJob & {
  client?: {
    id: string
    name: string
    email?: string
  }
  staff_member?: {
    id: string
    name: string
  }
  connection?: {
    id: string
    name: string
  }
  _count?: {
    instances: number
    completedInstances: number
  }
}

export type RecurringJobFormData = Omit<RecurringJob, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'paused_at' | 'cancelled_at' | 'created_by'>

export type EditScope = 'this' | 'future' | 'all'
