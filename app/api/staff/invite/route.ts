import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { staffId, email, name, businessName } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const supabase = await createSupabaseAdmin()

    // Verify staff record exists
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, business_id')
      .eq('id', staffId)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Create a temporary signup token (you can also use Supabase's built-in invite)
    // For now, we'll send a link to the signup page with their email pre-filled
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?email=${encodeURIComponent(email)}&invite=true&staff_id=${staffId}`

    // Send invitation email using Resend
    const { data, error } = await resend.emails.send({
      from: 'TradeQuote <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to join ${businessName || 'the team'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                background: #FF6B35;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6b7280;
                font-size: 14px;
              }
              .divider {
                border-top: 1px solid #e5e7eb;
                margin: 25px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Welcome to ${businessName || 'TradeQuote'}!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>You've been invited to join <strong>${businessName || 'the team'}</strong> on TradeQuote - Australia's leading job management software for trade businesses.</p>
              
              <p>Click the button below to create your account and get started:</p>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation & Create Account</a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 14px; color: #6b7280;">
                <strong>What you'll be able to do:</strong><br>
                • Manage jobs and track progress<br>
                • Create and send quotes<br>
                • Log timesheets<br>
                • Access your schedule<br>
                • And much more!
              </p>
              
              <div class="divider"></div>
              
              <p style="font-size: 13px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #FF6B35; word-break: break-all;">${inviteLink}</a>
              </p>
              
              <p style="font-size: 13px; color: #6b7280;">
                This invitation was sent to ${email}. If you weren't expecting this email, you can safely ignore it.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} TradeQuote. All rights reserved.</p>
              <p>Professional job management for Australian trade businesses</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[invite-staff] Resend error:', error)
      return NextResponse.json({ error: 'Failed to send invitation email', details: error }, { status: 500 })
    }

    // Update staff record with invitation timestamp
    await supabase
      .from('staff')
      .update({ invited_at: new Date().toISOString() })
      .eq('id', staffId)

    console.log('[invite-staff] Invitation sent successfully:', { email, emailId: data?.id })

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      emailId: data?.id 
    })

  } catch (error: any) {
    console.error('[invite-staff] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 })
  }
}
