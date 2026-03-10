import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { quoteId, message } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get quote details
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select(`
        *,
        jobs!job_id (
          job_name,
          clients!client_id (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', quoteId)
      .single()

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // TODO: Send follow-up email
    // Integrate with email service
    console.log('Would send follow-up email to:', quote.jobs?.clients?.email)
    console.log('Quote:', quote.quote_number, 'Amount:', quote.total)

    // Log communication
    await supabase.from('client_communications').insert({
      user_id: quote.user_id,
      client_id: quote.jobs?.clients?.id,
      related_type: 'quote',
      related_id: quoteId,
      communication_type: 'follow_up',
      method: 'email',
      subject: `Following up on Quote #${quote.quote_number}`,
      message: message || 'Just following up to see if you had any questions about the quote.',
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error sending follow-up:', error)
    return NextResponse.json({ error: 'Failed to send follow-up' }, { status: 500 })
  }
}
