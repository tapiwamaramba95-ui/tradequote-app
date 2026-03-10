import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, invoiceNumber } = await request.json()
  const supabase = await createSupabaseAdmin()

  try {
    console.log('[sendinvoice] Received request:', { to, invoiceNumber })

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single()
    console.log('[sendinvoice] Invoice fetch result:', { invoice, invoiceError })

    if (invoiceError || !invoice) {
      console.error('[sendinvoice] Invoice not found:', invoiceError)
      return NextResponse.json({ error: 'Invoice not found', details: invoiceError }, { status: 404 })
    }

    console.log('[sendinvoice] Invoice loaded:', { invoice_number: invoice.invoice_number, total: invoice.total })

    // Try to fetch job/client
    let jobNumber = 'Services'
    let clientName = 'Valued Client'
    let clientEmail = to
    let clientAddress = ''

    // Fetch business settings for branding
    let brandColor = '#0EA5A4' // Default teal
    let companyLogo = ''
    let companyName = ''
    
    const { data: settings } = await supabase
      .from('business_settings')
      .select('primary_brand_color, company_logo_url, company_name')
      .eq('user_id', invoice.user_id)
      .single()
    
    if (settings) {
      brandColor = settings.primary_brand_color || brandColor
      companyLogo = settings.company_logo_url || ''
      companyName = settings.company_name || ''
    }

    if (invoice.job_id) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('job_number, title, client_id')
        .eq('id', invoice.job_id)
        .single()
      console.log('[sendinvoice] Job fetch result:', { job, jobError })

      if (job) {
        jobNumber = job.job_number || 'Services'
        if (job.client_id) {
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('name, email, phone, address, street_address, town_city, state_region, postal_code')
            .eq('id', job.client_id)
            .single()
          console.log('[sendinvoice] Client fetch result:', { client, clientError })

          if (client) {
            clientName = client.name
            clientEmail = client.email || to
            const parts = [client.street_address || client.address, client.town_city, client.state_region, client.postal_code]
              .filter(Boolean)
            clientAddress = parts.join(', ')
          }
        }
      }
    }

    // Generate secure token for payment link
    const token = randomBytes(32).toString('hex')
    console.log('[sendinvoice] Generated token:', token)
    
    // Store token in database (valid for 90 days)
    const { error: tokenUpdateError } = await supabase
      .from('invoices')
      .update({ 
        view_token: token,
        token_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
    console.log('[sendinvoice] Token and status update result:', { tokenUpdateError })

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoice/view/${token}`
    
    const balance = Number(invoice.total) - Number(invoice.amount_paid || 0)

    // Send email with link
    let data = null
    try {
      data = await resend.emails.send({
        from: 'TradeQuote <onboarding@resend.dev>',
        to: [to],
        subject: `Invoice ${invoiceNumber} - Payment Due`,
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
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Invoice ${invoiceNumber}</h1>
              </div>
              
              <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #666;">Hi ${clientName},</p>
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #333;">Thank you for your business! Please find your invoice for <strong>${jobNumber}</strong>.</p>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #666; font-size: 14px;">Amount Due:</span>
                    <span style="font-size: 24px; font-weight: bold; color: ${brandColor};">$${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #666; font-size: 14px;">Due Date:</span>
                    <span style="color: #666; font-size: 14px;">${new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                  ${invoice.amount_paid > 0 ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #666; font-size: 14px;">Already Paid:</span>
                    <span style="color: #10B981; font-size: 14px; font-weight: 600;">$${Number(invoice.amount_paid).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  ` : ''}
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${invoiceUrl}" style="display: inline-block; background-color: ${brandColor}; color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">View Invoice & Pay</a>
                </div>
                
                <p style="margin: 30px 0 10px 0; font-size: 12px; color: #999; text-align: center;">Payment is due by ${new Date(invoice.due_date).toLocaleDateString()}.</p>
              </div>
            </body>
          </html>
        `
      })
      console.log('[sendinvoice] Email sent:', { data })
    } catch (emailError) {
      console.error('[sendinvoice] Email send error:', emailError)
      throw emailError
    }

    // Update job status to invoiced
    if (invoice.job_id) {
      const { error: jobStatusError } = await supabase
        .from('jobs')
        .update({ status: 'invoiced' })
        .eq('id', invoice.job_id)
      console.log('[sendinvoice] Job status update result:', { jobStatusError })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
