/**
 * Instance Generation Logic for Recurring Jobs
 * Calculates future dates and creates job instances based on recurring schedule
 */

import { createClient } from '@/lib/supabase-server'
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addQuarters, 
  addYears,
  isBefore, 
  isAfter,
  startOfDay,
  endOfDay,
  format
} from 'date-fns'
import type { RecurringJob } from './types'

/**
 * Generate job instances for a recurring job
 * Checks generation window and creates instances that don't exist yet
 */
export async function generateRecurringJobInstances(recurringJobId: string) {
  const supabase = await createClient()
  
  // Get recurring job details
  const { data: recurringJob, error } = await supabase
    .from('recurring_jobs')
    .select('*')
    .eq('id', recurringJobId)
    .single()
  
  if (error || !recurringJob) {
    throw new Error('Recurring job not found')
  }
  
  // Don't generate if paused, cancelled, or completed
  if (recurringJob.status !== 'active') {
    console.log(`Recurring job ${recurringJobId} is ${recurringJob.status}, skipping generation`)
    return []
  }
  
  // Calculate generation window
  const today = startOfDay(new Date())
  const generateUntil = addWeeks(today, recurringJob.generate_ahead_weeks)
  
  // Get last generated date or start from start_date
  const startFrom = recurringJob.last_generated_date 
    ? startOfDay(new Date(recurringJob.last_generated_date))
    : startOfDay(new Date(recurringJob.start_date))
  
  // Get existing instance count
  const { count: existingCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('recurring_job_id', recurringJobId)
  
  // Calculate next dates based on frequency
  const datesToGenerate = calculateNextDates(
    recurringJob,
    startFrom,
    generateUntil,
    existingCount || 0
  )
  
  if (datesToGenerate.length === 0) {
    console.log(`No new instances to generate for recurring job ${recurringJobId}`)
    return []
  }
  
  console.log(`Generating ${datesToGenerate.length} instances for recurring job ${recurringJobId}`)
  
  // Generate job instances
  const newInstances = []
  
  for (const { date, instanceNumber } of datesToGenerate) {
    const instance = {
      business_id: recurringJob.business_id,
      title: `${recurringJob.title} - ${format(date, 'dd/MM/yyyy')}`,
      description: recurringJob.description,
      client_id: recurringJob.client_id,
      street_address: recurringJob.street_address,
      suburb: recurringJob.suburb,
      state: recurringJob.state,
      postcode: recurringJob.postcode,
      staff_member_id: recurringJob.staff_member_id,
      assigned_connection_id: recurringJob.assigned_connection_id,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      line_items: recurringJob.line_items,
      recurring_job_id: recurringJob.id,
      recurrence_instance_number: instanceNumber,
      is_recurring_instance: true,
      status: 'scheduled'
    }
    
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert(instance)
      .select()
      .single()
    
    if (!jobError && newJob) {
      newInstances.push(newJob)
      
      // TODO: If assigned to connection, send notification
      // if (recurringJob.assigned_connection_id) {
      //   await notifyConnection(recurringJob.assigned_connection_id, newJob)
      // }
      
      // TODO: Sync to Google Calendar if enabled and assigned to staff
      // if (recurringJob.staff_member_id) {
      //   await syncToGoogleCalendar(recurringJob.staff_member_id, newJob)
      // }
    } else {
      console.error(`Failed to create instance for ${format(date, 'yyyy-MM-dd')}:`, jobError)
    }
  }
  
  // Update last generated date
  await supabase
    .from('recurring_jobs')
    .update({ 
      last_generated_date: format(generateUntil, 'yyyy-MM-dd')
    })
    .eq('id', recurringJobId)
  
  // Log history
  await supabase.rpc('log_recurring_job_history', {
    p_recurring_job_id: recurringJobId,
    p_action: 'edited',
    p_changes: { instances_generated: newInstances.length },
    p_affected_instances: newInstances.length
  })
  
  return newInstances
}

/**
 * Calculate the next dates that need instances created
 * Returns array of { date, instanceNumber } objects
 */
function calculateNextDates(
  recurringJob: RecurringJob,
  startFrom: Date,
  generateUntil: Date,
  existingCount: number
): Array<{ date: Date; instanceNumber: number }> {
  const dates: { date: Date; instanceNumber: number }[] = []
  let currentDate = new Date(startFrom)
  let instanceNumber = existingCount + 1
  
  // Safety limit to prevent infinite loops
  let iterations = 0
  const MAX_ITERATIONS = 1000
  
  while (isBefore(currentDate, generateUntil) && iterations < MAX_ITERATIONS) {
    iterations++
    
    // Check if we've hit the end condition
    if (recurringJob.end_type === 'after_occurrences' && 
        recurringJob.end_after_occurrences &&
        instanceNumber > recurringJob.end_after_occurrences) {
      break
    }
    
    if (recurringJob.end_type === 'on_date' && 
        recurringJob.end_date &&
        isAfter(currentDate, new Date(recurringJob.end_date))) {
      break
    }
    
    // Add date if it matches the pattern and is after start_date
    if (isAfter(currentDate, new Date(recurringJob.start_date)) || 
        currentDate.getTime() === new Date(recurringJob.start_date).getTime()) {
      if (matchesRecurringPattern(currentDate, recurringJob)) {
        dates.push({
          date: new Date(currentDate),
          instanceNumber: instanceNumber++
        })
      }
    }
    
    // Increment based on frequency
    currentDate = getNextDate(currentDate, recurringJob)
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.warn(`Reached max iterations (${MAX_ITERATIONS}) for recurring job calculation`)
  }
  
  return dates
}

/**
 * Check if a date matches the recurring pattern
 */
function matchesRecurringPattern(date: Date, recurringJob: RecurringJob): boolean {
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert to 1=Mon, 7=Sun
  
  switch (recurringJob.frequency) {
    case 'daily':
      return true // Every day matches
    
    case 'weekly':
    case 'fortnightly':
      // Check if this day of week is in the selected days
      return recurringJob.days_of_week?.includes(dayOfWeek) || false
    
    case 'monthly':
      // Check if this is the right day of month
      const dayOfMonth = date.getDate()
      if (recurringJob.day_of_month === -1) {
        // Last day of month
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
        return dayOfMonth === lastDay
      }
      return dayOfMonth === recurringJob.day_of_month
    
    case 'quarterly':
    case 'yearly':
      // Check if this is the right day and month
      const monthOfYear = date.getMonth() + 1 // 1-12
      const isRightMonth = !recurringJob.month_of_year || monthOfYear === recurringJob.month_of_year
      const isRightDay = !recurringJob.day_of_month || date.getDate() === recurringJob.day_of_month
      return isRightMonth && isRightDay
    
    default:
      return true
  }
}

/**
 * Get the next date to check based on frequency
 * For weekly/fortnightly, we check each day to see if it matches days_of_week
 * For others, we jump by the appropriate interval
 */
function getNextDate(currentDate: Date, recurringJob: RecurringJob): Date {
  const interval = recurringJob.interval_count || 1
  
  switch (recurringJob.frequency) {
    case 'daily':
      return addDays(currentDate, interval)
    
    case 'weekly':
      // Check each day for day_of_week match
      return addDays(currentDate, 1)
    
    case 'fortnightly':
      // Check each day, but the fortnightly logic is handled by interval_count
      return addDays(currentDate, 1)
    
    case 'monthly':
      return addMonths(currentDate, interval)
    
    case 'quarterly':
      return addQuarters(currentDate, interval)
    
    case 'yearly':
      return addYears(currentDate, interval)
    
    case 'custom':
      // For custom, default to daily check
      return addDays(currentDate, 1)
    
    default:
      return addDays(currentDate, 1)
  }
}

/**
 * Update a single job instance
 */
export async function updateJobInstance(jobId: string, updates: Record<string, any>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update job instance: ${error.message}`)
  }
  
  return data
}

/**
 * Update this instance and all future instances
 */
export async function updateFutureInstances(
  recurringJobId: string, 
  startingInstanceNumber: number,
  updates: Record<string, any>
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('recurring_job_id', recurringJobId)
    .gte('recurrence_instance_number', startingInstanceNumber)
    .select()
  
  if (error) {
    throw new Error(`Failed to update future instances: ${error.message}`)
  }
  
  // Log history
  await supabase.rpc('log_recurring_job_history', {
    p_recurring_job_id: recurringJobId,
    p_action: 'edited',
    p_changes: { updated_fields: Object.keys(updates), scope: 'future' },
    p_affected_instances: data.length
  })
  
  return data
}

/**
 * Update the recurring job template and optionally update all future instances
 */
export async function updateRecurringJobTemplate(
  recurringJobId: string,
  updates: Record<string, any>,
  updateFutureInstances: boolean = false
) {
  const supabase = await createClient()
  
  // Update the template
  const { data: recurringJob, error } = await supabase
    .from('recurring_jobs')
    .update(updates)
    .eq('id', recurringJobId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update recurring job template: ${error.message}`)
  }
  
  // If updating future instances, apply changes to all scheduled instances
  if (updateFutureInstances) {
    const instanceUpdates: Record<string, any> = {}
    
    // Only copy over job-related fields, not recurring-specific fields
    const copyableFields = [
      'title', 'description', 'client_id', 
      'street_address', 'suburb', 'state', 'postcode',
      'staff_member_id', 'assigned_connection_id', 'line_items'
    ]
    
    for (const field of copyableFields) {
      if (field in updates) {
        instanceUpdates[field] = updates[field]
      }
    }
    
    if (Object.keys(instanceUpdates).length > 0) {
      await supabase
        .from('jobs')
        .update(instanceUpdates)
        .eq('recurring_job_id', recurringJobId)
        .eq('status', 'scheduled') // Only update scheduled instances
    }
  }
  
  // Log history
  await supabase.rpc('log_recurring_job_history', {
    p_recurring_job_id: recurringJobId,
    p_action: 'edited',
    p_changes: updates,
    p_affected_instances: updateFutureInstances ? 1 : 0
  })
  
  return recurringJob
}

/**
 * Delete a single job instance
 */
export async function deleteJobInstance(jobId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
  
  if (error) {
    throw new Error(`Failed to delete job instance: ${error.message}`)
  }
}

/**
 * Delete all future instances (typically when cancelling a recurring job)
 */
export async function deleteFutureInstances(recurringJobId: string, startingInstanceNumber: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('recurring_job_id', recurringJobId)
    .gte('recurrence_instance_number', startingInstanceNumber)
    .eq('status', 'scheduled') // Only delete scheduled instances
  
  if (error) {
    throw new Error(`Failed to delete future instances: ${error.message}`)
  }
}
