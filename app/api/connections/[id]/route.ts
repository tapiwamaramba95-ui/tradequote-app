/**
 * POST /api/connections/[id]/resend - Resend invitation
 * DELETE /api/connections/[id] - Disconnect connection
 * PATCH /api/connections/[id] - Update connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { resendInvitation, disconnectConnection } from '@/lib/connections/invite'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * Resend invitation to a pending connection
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Verify connection belongs to user's business
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('id', id)
      .eq('invited_by_user_id', user.id)
      .single()
    
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    
    // Resend invitation
    await resendInvitation(id)
    
    return NextResponse.json({ message: 'Invitation resent successfully' })
  } catch (error: any) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}

/**
 * Disconnect a connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Verify connection belongs to user's business
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('id', id)
      .eq('invited_by_user_id', user.id)
      .single()
    
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    
    // Disconnect
    await disconnectConnection(id)
    
    return NextResponse.json({ message: 'Connection disconnected successfully' })
  } catch (error: any) {
    console.error('Error disconnecting connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect connection' },
      { status: 500 }
    )
  }
}

/**
 * Update connection details
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Verify connection belongs to user's business
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('id', id)
      .eq('invited_by_user_id', user.id)
      .single()
    
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    
    // Parse update data
    const updates = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'company_name', 'phone', 'mobile', 'trade', 'hourly_rate', 'notes']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)
    
    // Update connection
    const { data: updated, error } = await supabase
      .from('connections')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ connection: updated })
  } catch (error: any) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update connection' },
      { status: 500 }
    )
  }
}
