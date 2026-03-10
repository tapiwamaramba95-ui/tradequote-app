import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { quoteId, daysToExtend } = await request.json()

    if (!daysToExtend || daysToExtend <= 0) {
      return NextResponse.json({ error: 'Invalid number of days' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Calculate new valid_until date
    const currentValidUntil = quote.valid_until ? new Date(quote.valid_until) : new Date()
    const newValidUntil = new Date(currentValidUntil)
    newValidUntil.setDate(newValidUntil.getDate() + daysToExtend)

    // Update quote
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        valid_until: newValidUntil.toISOString(),
        original_valid_until: quote.original_valid_until || quote.valid_until || new Date().toISOString(),
        validity_extended_count: (quote.validity_extended_count || 0) + 1,
      })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Error extending quote validity:', updateError)
      return NextResponse.json({ error: 'Failed to extend quote validity' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      newValidUntil: newValidUntil.toISOString() 
    })

  } catch (error) {
    console.error('Error extending quote validity:', error)
    return NextResponse.json({ error: 'Failed to extend quote validity' }, { status: 500 })
  }
}
