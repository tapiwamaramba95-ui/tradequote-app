import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (data && data.session) {
      cookieStore.set('sb-access-token', data.session.access_token, { path: '/', httpOnly: true })
      cookieStore.set('sb-refresh-token', data.session.refresh_token, { path: '/', httpOnly: true })
    }
  }

  // Redirect to onboarding for new users after email verification
  return NextResponse.redirect(new URL('/onboarding?verified=true', request.url))
}