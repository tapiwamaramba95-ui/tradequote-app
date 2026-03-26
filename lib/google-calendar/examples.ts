// Example: How to integrate calendar sync with job operations

import { syncJobToCalendar, deleteJobFromCalendar } from '@/lib/google-calendar/sync'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Example 1: Sync job when creating
 */
export async function createJobWithCalendarSync(jobData: any, userId: string) {
  const supabase = await createSupabaseAdmin()
  
  // Create job in database
  const { data: job, error } = await supabase
    .from('jobs')
    .insert(jobData)
    .select('*, clients(name)')
    .single()
  
  if (error) throw error
  
  // Sync to Google Calendar if dates are set
  if (job.start_date) {
    try {
      const eventId = await syncJobToCalendar({
        ...job,
        client_name: job.clients?.name
      }, userId)
      
      // Save event ID back to job
      if (eventId) {
        await supabase
          .from('jobs')
          .update({ google_calendar_event_id: eventId })
          .eq('id', job.id)
      }
    } catch (error) {
      console.error('Calendar sync failed:', error)
      // Don't fail job creation if calendar sync fails
    }
  }
  
  return job
}

/**
 * Example 2: Sync job when updating
 */
export async function updateJobWithCalendarSync(
  jobId: string, 
  updates: any, 
  userId: string
) {
  const supabase = await createSupabaseAdmin()
  
  // Update job in database
  const { data: job, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select('*, clients(name)')
    .single()
  
  if (error) throw error
  
  // Sync to calendar if dates changed
  if (updates.start_date || updates.end_date || updates.title || updates.street_address) {
    try {
      const eventId = await syncJobToCalendar({
        ...job,
        client_name: job.clients?.name
      }, userId)
      
      // Save event ID if it's a new calendar event
      if (eventId && !job.google_calendar_event_id) {
        await supabase
          .from('jobs')
          .update({ google_calendar_event_id: eventId })
          .eq('id', jobId)
      }
    } catch (error) {
      console.error('Calendar sync failed:', error)
    }
  }
  
  return job
}

/**
 * Example 3: Delete calendar event when job is deleted
 */
export async function deleteJobWithCalendarSync(jobId: string, userId: string) {
  const supabase = await createSupabaseAdmin()
  
  // Get job with calendar event ID
  const { data: job } = await supabase
    .from('jobs')
    .select('google_calendar_event_id')
    .eq('id', jobId)
    .single()
  
  // Delete from calendar if it was synced
  if (job?.google_calendar_event_id) {
    try {
      await deleteJobFromCalendar(job.google_calendar_event_id, userId)
    } catch (error) {
      console.error('Failed to delete from calendar:', error)
    }
  }
  
  // Delete job from database
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
  
  if (error) throw error
}

/**
 * Example 4: API route with calendar sync
 */
// File: app/api/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Update job with calendar sync
    const job = await updateJobWithCalendarSync(params.id, updates, user.id)
    
    return NextResponse.json({ job })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    )
  }
}
