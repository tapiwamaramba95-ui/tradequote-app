/**
 * Connection invitation system
 * Handles inviting subcontractors and sending invitation emails
 */

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-sender'
import type { Connection, ConnectionInvitation } from './types'

/**
 * Invite a new connection (subcontractor)
 * @param invitation Connection invitation data
 * @param invitedByUserId User ID of the inviter
 * @param businessId Business ID
 * @returns Created connection
 */
export async function inviteConnection(
  invitation: ConnectionInvitation,
  invitedByUserId: string,
  businessId: string
): Promise<Connection> {
  const supabase = await createSupabaseAdmin()
  
  // Check if connection already exists
  const { data: existing, error: checkError } = await supabase
    .from('connections')
    .select('id, status')
    .eq('email', invitation.email.toLowerCase().trim())
    .eq('invited_by_business_id', businessId)
    .single()
  
  if (existing) {
    if (existing.status === 'disconnected') {
      // Re-invite disconnected connection
      const { data, error } = await supabase
        .from('connections')
        .update({
          status: 'pending',
          invitation_sent_at: new Date().toISOString(),
          is_active: true,
          // Update any changed details
          ...invitation
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.error('Error re-inviting connection:', error)
        throw new Error('Failed to resend invitation')
      }
      
      // Send invitation email
      await sendConnectionInvitationEmail(data)
      return data
    }
    
    throw new Error(`Connection already exists with status: ${existing.status}`)
  }
  
  // Create new connection
  const { data: connection, error } = await supabase
    .from('connections')
    .insert({
      ...invitation,
      email: invitation.email.toLowerCase().trim(),
      invited_by_user_id: invitedByUserId,
      invited_by_business_id: businessId,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating connection:', error)
    throw new Error('Failed to create connection')
  }
  
  // Send invitation email
  await sendConnectionInvitationEmail(connection)
  
  return connection
}

/**
 * Send connection invitation email
 * @param connection Connection data
 */
export async function sendConnectionInvitationEmail(connection: Connection) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections/accept?token=${connection.id}`
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
          .benefits { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits h3 { margin-top: 0; color: #92400e; }
          .benefits ul { margin: 10px 0; padding-left: 20px; }
          .benefits li { margin: 8px 0; color: #78350f; }
          .button { display: inline-block; background: #ea580c; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #c2410c; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've been invited to TradeQuote</h1>
          </div>
          
          <div class="content">
            <p>Hi ${connection.name ? connection.name : 'there'},</p>
            
            <p>A trade business has invited you to join as a connection on TradeQuote. This is a free account that allows you to collaborate on jobs and manage appointments together.</p>
            
            <div class="benefits">
              <h3>As a connection, you'll be able to:</h3>
              <ul>
                <li>✓ View scheduled appointments and job assignments</li>
                <li>✓ Accept or decline job invitations</li>
                <li>✓ See job details, locations, and client information</li>
                <li>✓ Communicate with the business</li>
                <li>✓ Track your appointments in one place</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <strong>This is completely free</strong> - you won't be charged anything. Your account will have limited features focused on managing appointments and viewing assigned jobs.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p>TradeQuote - Trade Business Management Software</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This email was sent because someone invited you to connect on TradeQuote.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const result = await sendEmail({
    to: connection.email,
    subject: `You've been invited to connect on TradeQuote`,
    html: emailHtml
  })
  
  if (!result.success) {
    console.error('Failed to send connection invitation email:', result.error)
    // Don't throw - connection already created, email failure shouldn't block
  }
  
  return result
}

/**
 * Resend invitation to a pending connection
 * @param connectionId Connection ID
 */
export async function resendInvitation(connectionId: string): Promise<void> {
  const supabase = await createSupabaseAdmin()
  
  const { data: connection, error } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single()
  
  if (error || !connection) {
    throw new Error('Connection not found')
  }
  
  if (connection.status !== 'pending') {
    throw new Error('Can only resend invitations for pending connections')
  }
  
  // Update invitation_sent_at
  await supabase
    .from('connections')
    .update({ invitation_sent_at: new Date().toISOString() })
    .eq('id', connectionId)
  
  // Resend email
  await sendConnectionInvitationEmail(connection)
}

/**
 * Disconnect a connection
 * @param connectionId Connection ID
 */
export async function disconnectConnection(connectionId: string): Promise<void> {
  const supabase = await createSupabaseAdmin()
  
  const { error } = await supabase
    .from('connections')
    .update({
      status: 'disconnected',
      disconnected_at: new Date().toISOString(),
      is_active: false
    })
    .eq('id', connectionId)
  
  if (error) {
    console.error('Error disconnecting connection:', error)
    throw new Error('Failed to disconnect connection')
  }
}
