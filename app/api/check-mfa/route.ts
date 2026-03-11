import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get MFA factors
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    
    console.log('Raw factors response:', { factors, factorsError })
    
    if (factorsError) {
      return NextResponse.json({ 
        error: 'Failed to check MFA status',
        details: factorsError.message 
      }, { status: 500 })
    }

    // Check different possible structures for factors
    const totpFactors = factors?.totp || []
    const allFactors = factors?.all || []
    
    console.log('Processed factors:', { 
      totpFactors, 
      allFactors, 
      originalStructure: factors 
    })

    const hasMFA = totpFactors.length > 0

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      mfa: {
        enabled: hasMFA,
        factors: totpFactors.map(f => ({
          id: f.id,
          status: f.status,
          created_at: f.created_at,
          factor_type: f.factor_type || 'totp'
        })),
        debug: {
          rawFactors: factors,
          allFactors: allFactors.length,
          totpFactors: totpFactors.length
        }
      }
    })

  } catch (error) {
    console.error('MFA check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: String(error)
    }, { status: 500 })
  }
}