/**
 * POST /api/connections/invite
 * Invite a new subcontractor connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { inviteConnection } from '@/lib/connections/invite'
import type { ConnectionInvitation } from '@/lib/connections/types'

export async function POST(request: NextRequest) {
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
    
    // Parse invitation data
    const invitation: ConnectionInvitation = await request.json()
    
    // Validate required fields
    if (!invitation.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    // Create connection and send invitation
    const connection = await inviteConnection(
      invitation,
      user.id,
      userBusiness.business_id
    )
    
    return NextResponse.json({ connection }, { status: 201 })
  } catch (error: any) {
    console.error('Error inviting connection:', error)
    
    // Handle specific errors
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
