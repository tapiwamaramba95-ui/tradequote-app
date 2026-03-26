// Google Calendar OAuth2 client utilities
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Initialize and return OAuth2 client with credentials
 */
export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.')
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )
}

/**
 * Generate Google OAuth authorization URL
 * User will be redirected here to grant calendar access
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Gets refresh token
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent' // Force consent screen to always get refresh token
  })
}

/**
 * Exchange authorization code for access tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Create calendar API client with user's tokens
 */
export function getCalendarClient(tokens: any) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(tokens)
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Refresh expired access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}
