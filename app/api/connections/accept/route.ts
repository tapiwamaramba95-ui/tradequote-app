/**
 * POST /api/connections/accept
 * Accept a connection invitation
 * This is called by the subcontractor/connection user to accept the invitation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const supabaseAdmin = await createSupabaseAdmin()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Parse request body
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    
    // Get connection by token (id)
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('connections')
      .select('*')
      .eq('id', token)
      .single()
    
    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }
    
    // Check if already accepted or declined
    if (connection.status === 'accepted') {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }
    
    if (connection.status === 'declined') {
      return NextResponse.json({ error: 'Invitation was declined' }, { status: 400 })
    }
    
    // Check if email matches (optional - user might have signed up with different email)
    // We'll allow it but log a warning
    if (user.email && connection.email.toLowerCase() !== user.email.toLowerCase()) {
      console.warn(
        `User ${user.email} accepting invitation for ${connection.email}. Emails don't match.`
      )
    }
    
    // Update connection status
    const { error: updateError } = await supabaseAdmin
      .from('connections')
      .update({
        status: 'accepted',
        connected_user_id: user.id,
        accepted_at: new Date().toISOString()
      })
      .eq('id', token)
    
    if (updateError) {
      console.error('Error updating connection:', updateError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }
    
    // Update user profile to mark as connection
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_connection: true,
        connection_account_type: 'limited'
      })
      .eq('user_id', user.id)
    
    if (profileError) {
      console.error('Error updating user profile:', profileError)
      // Don't fail - connection is already accepted
    }
    
    return NextResponse.json({ 
      message: 'Connection accepted successfully',
      connection_id: connection.id
    })
  } catch (error: any) {
    console.error('Error accepting connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
