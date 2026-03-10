import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { reason } = body

    const supabase = await createSupabaseAdmin()

    // Fetch the quote by token
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('view_token', token)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check if token has expired
    if (quote.token_expires_at && new Date(quote.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Quote link has expired' }, { status: 410 })
    }

    // Update quote status to declined
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'declined',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null
      })
      .eq('id', quote.id)

    if (updateError) {
      console.error('Error updating quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline quote' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Quote decline error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
