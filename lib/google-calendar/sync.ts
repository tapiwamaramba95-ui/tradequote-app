// Calendar sync functions for jobs
import { getCalendarClient, refreshAccessToken } from './client'
import { getUserGoogleTokens, saveUserGoogleTokens } from './tokens'

export type Job = {
  id: string
  job_number: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  street_address?: string
  suburb?: string
  state?: string
  postcode?: string
  client_name?: string
  google_calendar_event_id?: string
}

/**
 * Sync a job to Google Calendar
 * Creates new event or updates existing one
 */
export async function syncJobToCalendar(job: Job, userId: string): Promise<string | null> {
  try {
    // Get user's tokens
    let tokens = await getUserGoogleTokens(userId)
    if (!tokens) {
      console.log('User has not connected Google Calendar')
      return null
    }
    
    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      console.log('Token expired, refreshing...')
      try {
        tokens = await refreshAccessToken(tokens.refresh_token)
        await saveUserGoogleTokens(userId, tokens)
      } catch (error) {
        console.error('Failed to refresh token:', error)
        // Token might be revoked, return null
        return null
      }
    }
    
    // Get calendar client
    const calendar = getCalendarClient(tokens)
    
    // Build full address from job fields
    const addressParts = [
      job.street_address,
      job.suburb,
      job.state,
      job.postcode
    ].filter(Boolean)
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined
    
    // Build event description
    const descriptionParts = [
      `Job #${job.job_number}`,
      job.client_name ? `Client: ${job.client_name}` : null,
      job.description
    ].filter(Boolean)
    
    // Create event object
    const event = {
      summary: job.title || `Job #${job.job_number}`,
      description: descriptionParts.join('\n\n'),
      location: fullAddress,
      start: {
        dateTime: job.start_date,
        timeZone: 'Australia/Melbourne'
      },
      end: {
        dateTime: job.end_date || job.start_date,
        timeZone: 'Australia/Melbourne'
      },
      colorId: '9' // Blue color for jobs
    }
    
    // If event already exists, update it
    if (job.google_calendar_event_id) {
      try {
        const response = await calendar.events.update({
          calendarId: 'primary',
          eventId: job.google_calendar_event_id,
          requestBody: event
        })
        
        console.log('Updated calendar event:', response.data.id)
        return response.data.id || null
      } catch (error: any) {
        // If event not found, create a new one
        if (error?.code === 404) {
          console.log('Event not found, creating new one')
        } else {
          throw error
        }
      }
    }
    
    // Create new event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    })
    
    console.log('Created calendar event:', response.data.id)
    return response.data.id || null
  } catch (error) {
    console.error('Error syncing job to calendar:', error)
    // Don't throw - we don't want calendar sync failures to break job operations
    return null
  }
}

/**
 * Delete a job from Google Calendar
 */
export async function deleteJobFromCalendar(eventId: string, userId: string): Promise<void> {
  try {
    let tokens = await getUserGoogleTokens(userId)
    if (!tokens) {
      console.log('User has not connected Google Calendar')
      return
    }
    
    // Refresh token if expired
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      console.log('Token expired, refreshing...')
      try {
        tokens = await refreshAccessToken(tokens.refresh_token)
        await saveUserGoogleTokens(userId, tokens)
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return
      }
    }
    
    const calendar = getCalendarClient(tokens)
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    })
    
    console.log('Deleted calendar event:', eventId)
  } catch (error: any) {
    // If event not found, that's okay - it's already gone
    if (error?.code === 404) {
      console.log('Calendar event already deleted')
      return
    }
    console.error('Error deleting calendar event:', error)
    // Don't throw - calendar deletion failures shouldn't break job operations
  }
}
