import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/invoices/deposit
 * Generate a deposit invoice from an accepted quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quote_id } = body

    if (!quote_id) {
      return NextResponse.json(
        { error: 'quote_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Fetch the quote with all details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        jobs!job_id (
          id,
          client_id,
          total_amount,
          user_id
        )
      `)
      .eq('id', quote_id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Verify quote is accepted
    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Quote must be accepted before creating deposit invoice' },
        { status: 400 }
      )
    }

    const userId = quote.user_id || quote.jobs?.user_id
    if (!userId) {
      return NextResponse.json(
        { error: 'Could not determine user for this quote' },
        { status: 400 }
      )
    }

    // Get business settings to check deposit percentage
    const { data: settings } = await supabase
      .from('business_settings')
      .select('deposit_percentage, deposit_required, invoice_prefix, invoice_start_number')
      .eq('user_id', userId)
      .single()

    if (!settings?.deposit_required) {
      return NextResponse.json(
        { error: 'Deposit invoices are not enabled for this account' },
        { status: 400 }
      )
    }

    const depositPercentage = settings.deposit_percentage || 30

    // Calculate deposit amount
    const quoteTotal = parseFloat(quote.total) || 0
    const depositAmount = (quoteTotal * depositPercentage) / 100
    const depositSubtotal = depositAmount / (1 + (quote.tax_rate || 10) / 100)
    const depositTax = depositAmount - depositSubtotal

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const invoicePrefix = settings.invoice_prefix || 'INV'
    const startNumber = settings.invoice_start_number || 1
    const nextNumber = (count || 0) + startNumber
    const invoiceNumber = `${invoicePrefix}${String(nextNumber).padStart(5, '0')}`

    // Create deposit invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        job_id: quote.job_id,
        client_id: quote.client_id,
        quote_id: quote_id,
        type: 'deposit',
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        line_items: [
          {
            id: '1',
            description: `Deposit (${depositPercentage}%) for ${quote.jobs?.title || 'Job'}`,
            quantity: 1,
            rate: depositSubtotal,
            amount: depositSubtotal
          }
        ],
        subtotal: depositSubtotal,
        tax: depositTax,
        tax_rate: quote.tax_rate || 10,
        total: depositAmount,
        amount_paid: 0,
        notes: `Deposit invoice for Quote #${quote.quote_number}\\n\\nThis represents ${depositPercentage}% of the total project value of $${quoteTotal.toFixed(2)}.`,
        terms: quote.terms || 'Payment due within 7 days',
        status: 'sent'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating deposit invoice:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create deposit invoice' },
        { status: 500 }
      )
    }

    // Update job with deposit info
    if (quote.job_id) {
      await supabase
        .from('jobs')
        .update({
          deposit_required: true,
          deposit_invoice_id: invoice.id
        })
        .eq('id', quote.job_id)
    }

    return NextResponse.json({
      invoice,
      message: `Deposit invoice ${invoiceNumber} created successfully`,
      deposit_percentage: depositPercentage,
      deposit_amount: depositAmount
    })
  } catch (error) {
    console.error('Error in POST /api/invoices/deposit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
