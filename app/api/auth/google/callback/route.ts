// Google Calendar OAuth callback handler
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTokensFromCode } from '@/lib/google-calendar/client'
import { saveUserGoogleTokens } from '@/lib/google-calendar/tokens'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const settingsUrl = `${baseUrl}/dashboard/settings/integrations`
  
  // Handle user denied access
  if (error === 'access_denied') {
    return NextResponse.redirect(
      `${settingsUrl}?error=access_denied`
    )
  }
  
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      `${settingsUrl}?error=oauth_error`
    )
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${settingsUrl}?error=no_code`
    )
  }
  
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(
        `${baseUrl}/login?error=not_authenticated&redirect=${encodeURIComponent(settingsUrl)}`
      )
    }
    
    // Exchange authorization code for tokens
    console.log('Exchanging code for tokens...')
    const tokens = await getTokensFromCode(code)
    
    if (!tokens.refresh_token) {
      console.error('No refresh token received')
      return NextResponse.redirect(
        `${settingsUrl}?error=no_refresh_token`
      )
    }
    
    // Save tokens to database
    console.log('Saving tokens to database...')
    await saveUserGoogleTokens(session.user.id, tokens)
    
    console.log('Successfully connected Google Calendar')
    
    // Redirect back to settings with success
    return NextResponse.redirect(
      `${settingsUrl}?success=calendar_connected`
    )
  } catch (err: any) {
    console.error('Error in OAuth callback:', err)
    return NextResponse.redirect(
      `${settingsUrl}?error=token_exchange_failed&message=${encodeURIComponent(err.message || 'Unknown error')}`
    )
  }
}
