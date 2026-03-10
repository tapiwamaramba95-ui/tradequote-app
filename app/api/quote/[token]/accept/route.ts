import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

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

    // Update quote status to accepted
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', quote.id)

    if (updateError) {
      console.error('Error updating quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept quote' },
        { status: 500 }
      )
    }

    // Update job status to approved if exists
    if (quote.job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'approved' })
        .eq('id', quote.job_id)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Quote acceptance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

