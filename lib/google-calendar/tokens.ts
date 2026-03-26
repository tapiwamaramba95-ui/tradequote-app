// Token storage and retrieval functions for Google Calendar
import { createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Save Google Calendar OAuth tokens to user profile
 */
export async function saveUserGoogleTokens(userId: string, tokens: any) {
  const supabase = await createSupabaseAdmin()
  
  const tokenData = {
    ...tokens,
    connected_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ google_calendar_tokens: tokenData })
    .eq('id', userId)
  
  if (error) {
    console.error('Error saving Google tokens:', error)
    throw error
  }
  
  return tokenData
}

/**
 * Get user's Google Calendar tokens from profile
 */
export async function getUserGoogleTokens(userId: string) {
  const supabase = await createSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('google_calendar_tokens')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error getting Google tokens:', error)
    throw error
  }
  
  return data?.google_calendar_tokens || null
}

/**
 * Delete user's Google Calendar tokens (disconnect)
 */
export async function deleteUserGoogleTokens(userId: string) {
  const supabase = await createSupabaseAdmin()
  
  const { error } = await supabase
    .from('profiles')
    .update({ google_calendar_tokens: null })
    .eq('id', userId)
  
  if (error) {
    console.error('Error deleting Google tokens:', error)
    throw error
  }
}

/**
 * Check if user has connected Google Calendar
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
  const tokens = await getUserGoogleTokens(userId)
  return tokens !== null
}
