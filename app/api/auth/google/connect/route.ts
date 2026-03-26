// Google Calendar OAuth connect endpoint
import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar/client'

export async function GET() {
  try {
    const authUrl = getAuthUrl()
    console.log('Redirecting to Google OAuth URL')
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error generating auth URL:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings/integrations?error=auth_url_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`
    )
  }
}
