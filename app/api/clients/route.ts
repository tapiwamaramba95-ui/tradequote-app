import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (q) query = query.ilike('name', `%${q}%`).limit(50)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clients: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract user's access token from cookies
    const cookieStore = await import('next/headers').then(m => m.cookies())
    // Find the Supabase auth token cookie (project-ref based)
    const accessTokenCookie = cookieStore.getAll().find(c => c.name.endsWith('-auth-token'))
    let accessToken = undefined;
    if (accessTokenCookie) {
      try {
        // New Supabase format: cookie value is base64-encoded JSON
        const decoded = Buffer.from(accessTokenCookie.value, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        accessToken = parsed.access_token;
      } catch {
        // Fallback: treat as raw JWT
        accessToken = accessTokenCookie.value;
      }
    }
    // Create Supabase client with user's token
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
        global: { headers: { Authorization: `Bearer ${accessToken || ''}` } }
      }
    )
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...body, user_id: user.id }])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ client: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}