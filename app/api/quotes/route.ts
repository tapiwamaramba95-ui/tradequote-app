import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/quotes - List all quotes for the current user
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients!client_id (
          id,
          name
        ),
        jobs!job_id (
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quotes:', error)
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Quotes fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/quotes - Create a new quote with proper numbering
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, job_id, line_items, notes, terms, valid_until } = body

    // Fetch business settings to get quote numbering config
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('quote_prefix, quote_start_number')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      console.error('Error fetching business settings:', settingsError)
    }

    // Get highest existing quote number to determine next number
    const quotePrefix = settings?.quote_prefix || 'Q'
    const startNumber = settings?.quote_start_number || 1

    const { data: lastQuote } = await supabase
      .from('quotes')
      .select('quote_number')
      .eq('user_id', user.id)
      .like('quote_number', `${quotePrefix}%`)
      .order('quote_number', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = startNumber
    if (lastQuote?.quote_number) {
      // Extract number from last quote (e.g., Q0005 -> 5)
      const numberMatch = lastQuote.quote_number.match(new RegExp(`^${quotePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`))
      if (numberMatch) {
        nextNumber = parseInt(numberMatch[1]) + 1
      }
    }
    
    const quoteNumber = `${quotePrefix}${String(nextNumber).padStart(4, '0')}`

    // Calculate totals
    const subtotal = line_items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0)
    const taxRate = 0.10 // You might want to get this from business settings too
    const tax = subtotal * taxRate
    const total = subtotal + tax

    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id: client_id,
        job_id: job_id || null,
        quote_number: quoteNumber,
        line_items,
        subtotal,
        tax,
        total,
        notes: notes || '',
        terms: terms || 'Payment due within 30 days',
        valid_until: valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating quote:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to create quote' }, { status: 500 })
    }

    return NextResponse.json({ quote }, { status: 201 })
  } catch (error) {
    console.error('Quote creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}