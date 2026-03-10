import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  let userId: string | undefined
  try {
    const body = await request.json()
    userId = body.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Fetch only the 5 most recent jobs with client info
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, job_number, job_name, status, total_amount, scheduled_date, job_address, clients(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Recent jobs error:', error)
      return NextResponse.json({ error: 'Failed to fetch recent jobs' }, { status: 500 })
    }

    return NextResponse.json(jobs || [])
  } catch (error) {
    console.error('Recent jobs error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    })
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
