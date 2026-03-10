import { createServerClient } from '@supabase/ssr'

export const createSupabaseAdmin = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase config. URL: ${url ? 'set' : 'MISSING'}, ServiceRoleKey: ${serviceRoleKey ? 'set' : 'MISSING'}. Add SUPABASE_SERVICE_ROLE_KEY to .env.local`
    )
  }

  // Use service role key for admin operations (bypasses RLS)
  return createServerClient(
    url,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet) {
          // No-op for admin client
        },
      },
    }
  )
}
