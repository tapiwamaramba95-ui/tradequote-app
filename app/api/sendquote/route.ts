import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, quoteNumber } = await request.json()
  const supabase = await createSupabaseAdmin()

  try {
    console.log('[sendquote] Received request:', { to, quoteNumber })

    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_number', quoteNumber)
      .single()
    console.log('[sendquote] Quote fetch result:', { quote, quoteError })

    if (quoteError || !quote) {
      console.error('[sendquote] Quote not found:', quoteError)
      return NextResponse.json({ error: 'Quote not found', details: quoteError }, { status: 404 })
    }

    console.log('[sendquote] Quote loaded:', { quote_number: quote.quote_number, total: quote.total, client_id: quote.client_id, job_id: quote.job_id })

    // Fetch client details - try direct client_id first, then through job
    let jobNumber = 'Project'
    let clientName = 'Valued Client'
    let clientEmail = to // Use email from request as fallback
    let clientAddress = ''
    let clientData = null

    // First, try to fetch client directly from quote.client_id
    if (quote.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name, email, phone, address')
        .eq('id', quote.client_id)
        .single()
      
      console.log('[sendquote] Direct client fetch result:', { client, clientError })
      
      if (client) {
        clientData = client
        clientName = client.name
        clientEmail = client.email || to
        clientAddress = client.address || ''
      }
    }

    // Fetch business settings for branding
    let brandColor = '#0EA5A4' // Default teal
    let companyLogo = ''
    let companyName = ''
    
    const { data: settings } = await supabase
      .from('business_settings')
      .select('primary_brand_color, company_logo_url, company_name')
      .eq('user_id', quote.user_id)
      .single()
    
    if (settings) {
      brandColor = settings.primary_brand_color || brandColor
      companyLogo = settings.company_logo_url || ''
      companyName = settings.company_name || ''
    }

    // If no direct client found, try through job relationship
    if (!clientData && quote.job_id) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('job_number, title, client_id')
        .eq('id', quote.job_id)
        .single()
      console.log('[sendquote] Job fetch result:', { job, jobError })

      if (job) {
        jobNumber = job.job_number || 'Project'
        if (job.client_id) {
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('name, email, phone, address')
            .eq('id', job.client_id)
            .single()
          console.log('[sendquote] Client fetch via job result:', { client, clientError })

          if (client) {
            clientData = client
            clientName = client.name
            clientEmail = client.email || to
            clientAddress = client.address || ''
          }
        }
      }
    }

    // Validate that we have client details
    if (!clientData || !clientName || clientName === 'Valued Client') {
      console.error('[sendquote] Missing client details:', { 
        clientData, 
        clientName, 
        hasDirectClientId: !!quote.client_id,
        hasJobId: !!quote.job_id,
        quoteId: quote.id,
        quoteNumber: quote.quote_number
      })
      return NextResponse.json({ 
        error: 'Client details are required to send quote', 
        details: `Quote ${quote.quote_number} must have valid client information before sending. Missing: ${!clientData ? 'client data' : ''} ${!clientName || clientName === 'Valued Client' ? 'client name' : ''}`.trim()
      }, { status: 400 })
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    console.log('[sendquote] Generated token:', token)
    
    // Store token in database and update status to awaiting acceptance (valid for 30 days)
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: tokenUpdateError } = await supabase
      .from('quotes')
      .update({ 
        view_token: token,
        token_expires_at: tokenExpiresAt,
        status: 'sent'
      })
      .eq('id', quote.id)
    console.log('[sendquote] Token and status update result:', { tokenUpdateError })
    
    if (tokenUpdateError) {
      console.error('[sendquote] Failed to update quote with token:', tokenUpdateError)
      return NextResponse.json({ error: 'Failed to prepare quote for sending' }, { status: 500 })
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const quoteUrl = `${baseUrl}/quote/view/${token}`

    // Send simple email with link
    let data = null
    try {
      data = await resend.emails.send({
        from: 'TradeQuote <onboarding@resend.dev>',
        to: [to],
        subject: `Your Quote is Ready`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
              <div style="background-color: ${brandColor}; border-radius: 12px 12px 0 0; padding: 40px 30px; text-align: center;">
                ${companyLogo 
                  ? `<img src="${companyLogo}" alt="${companyName || 'Company Logo'}" style="max-width: 200px; max-height: 60px; margin-bottom: 15px;" />`
                  : companyName ? `<div style="color: white; font-size: 24px; font-weight: 700; margin-bottom: 15px;">${companyName}</div>` : ''
                }
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Your Quote is Ready</h1>
              </div>
              
              <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #666;">Hi ${clientName},</p>
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #333;">Thank you for your interest! Your quote for <strong>${jobNumber}</strong> is ready to view.</p>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #666; font-size: 14px;">Quote Total:</span>
                    <span style="font-size: 16px; font-weight: bold; color: ${brandColor};">$${Number(quote.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #666; font-size: 14px;">Bill To:</span>
                    <span style="color: #666; font-size: 14px;">${clientName}</span>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${quoteUrl}" style="display: inline-block; background-color: ${brandColor}; color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">View Quote & Respond</a>
                </div>
                
                <p style="margin: 30px 0 10px 0; font-size: 12px; color: #999; text-align: center;">This link will expire in 30 days.</p>
              </div>
            </body>
          </html>
        `
      })
      console.log('[sendquote] Email sent:', { data })
    } catch (emailError) {
      console.error('[sendquote] Email send error:', emailError)
      throw emailError
    }

    // Update job status to quoted
    if (quote.job_id) {
      const { error: jobStatusError } = await supabase
        .from('jobs')
        .update({ status: 'quoted' })
        .eq('id', quote.job_id)
      console.log('[sendquote] Job status update result:', { jobStatusError })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}