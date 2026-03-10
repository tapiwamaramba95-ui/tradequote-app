import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createSupabaseAdmin()

    // Find quote by view token
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('view_token', token)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check if token is expired
    if (quote.token_expires_at) {
      const expiresAt = new Date(quote.token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'Quote link has expired' }, { status: 410 })
      }
    }

    // Load job and client data if available
    let job = null
    let client = null
    let businessSettings = null
    let userId = quote.user_id

    // If no user_id on quote, try to get from job
    if (quote.job_id) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('title, client_id, user_id')
        .eq('id', quote.job_id)
        .single()

      if (jobData) {
        job = jobData
        // Use job's user_id if quote doesn't have one
        if (!userId && jobData.user_id) {
          userId = jobData.user_id
          // Fix quote user_id if it's missing
          await supabase
            .from('quotes')
            .update({ user_id: jobData.user_id })
            .eq('id', quote.id)
        }

        if (jobData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('name, email, phone, address')
            .eq('id', jobData.client_id)
            .single()

          if (clientData) {
            client = clientData
          }
        }
      }
    }

    // If still no user_id, try to find the business owner
    // This handles cases where quotes exist without jobs
    if (!userId) {
      const { data: businessList } = await supabase
        .from('business_settings')
        .select('user_id')
        .limit(1)
        .single()
      
      if (businessList) {
        userId = businessList.user_id
        // Update the quote with the correct user_id
        await supabase
          .from('quotes')
          .update({ user_id: userId })
          .eq('id', quote.id)
      }
    }

    // Load business settings for branding
    if (userId) {
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('primary_brand_color, company_logo_url, company_name')
        .eq('user_id', userId)
        .maybeSingle()

      if (settings && !settingsError) {
        businessSettings = settings
      }
    }

    // Ensure line_items exists (fallback for missing database field)
    if (!quote.line_items) {
      quote.line_items = []
    }

    return NextResponse.json({
      quote,
      job,
      client,
      businessSettings,
    })
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}
