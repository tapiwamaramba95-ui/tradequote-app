/**
 * GET /api/connections
 * List all connections for the authenticated user's business
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get user's business_id
    const { data: userBusiness } = await supabase
      .from('user_businesses')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    if (!userBusiness || !userBusiness.business_id) {
      return NextResponse.json({ error: 'No business found for user' }, { status: 400 })
    }
    
    // Get search params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by status
    const search = searchParams.get('search') // Search by name/email
    
    // Build query
    let query = supabase
      .from('connections')
      .select('*')
      .eq('invited_by_business_id', userBusiness.business_id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`)
    }
    
    const { data: connections, error } = await query
    
    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ connections })
  } catch (error: any) {
    console.error('Error in GET /api/connections:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}
