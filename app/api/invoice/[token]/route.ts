import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createSupabaseAdmin()

    // Find invoice by view token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('view_token', token)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if token is expired
    if (invoice.token_expires_at) {
      const expiresAt = new Date(invoice.token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invoice link has expired' }, { status: 410 })
      }
    }

    // Load job and client data if available
    let job = null
    let client = null
    let businessSettings = null
    let userId = invoice.user_id

    // If no user_id on invoice, try to get from job
    if (invoice.job_id) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('title, job_number, client_id, user_id')
        .eq('id', invoice.job_id)
        .single()

      if (jobData) {
        job = jobData
        // Use job's user_id if invoice doesn't have one
        if (!userId && jobData.user_id) {
          userId = jobData.user_id
          // Fix invoice user_id if it's missing
          await supabase
            .from('invoices')
            .update({ user_id: jobData.user_id })
            .eq('id', invoice.id)
        }

        if (jobData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('name, email, phone, street_address, suburb, state, postcode')
            .eq('id', jobData.client_id)
            .single()

          if (clientData) {
            // Format address from structured fields
            const addressParts = []
            if (clientData.street_address) addressParts.push(clientData.street_address)
            if (clientData.suburb || clientData.state || clientData.postcode) {
              const locationParts = [clientData.suburb, clientData.state, clientData.postcode].filter(Boolean)
              if (locationParts.length > 0) {
                addressParts.push(locationParts.join(' '))
              }
            }
            client = {
              ...clientData,
              address: addressParts.join(', ') || ''
            }
          }
        }
      }
    }

    // If still no user_id, try to find the business owner
    // This handles cases where invoices exist without jobs
    if (!userId) {
      const { data: businessList } = await supabase
        .from('business_settings')
        .select('user_id')
        .limit(1)
        .single()
      
      if (businessList) {
        userId = businessList.user_id
        // Update the invoice with the correct user_id
        await supabase
          .from('invoices')
          .update({ user_id: userId })
          .eq('id', invoice.id)
      }
    }

    // Load business settings for branding and bank details
    if (userId) {
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (settings && !settingsError) {
        businessSettings = settings
      }
    }

    // Ensure line_items exists (fallback for missing database field)
    if (!invoice.line_items) {
      invoice.line_items = []
    }

    return NextResponse.json({
      invoice,
      job,
      client,
      businessSettings,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
