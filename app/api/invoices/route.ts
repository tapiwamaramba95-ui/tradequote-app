import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      job_id,
      quote_id,
      invoice_date,
      due_date,
      line_items,
      subtotal,
      tax,
      total,
      notes,
      terms,
      status
    } = body

    // Validate required fields
    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      )
    }

    if (!line_items || line_items.length === 0) {
      return NextResponse.json(
        { error: 'line_items are required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Get user_id from the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('user_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Fetch business settings to get invoice numbering config
    const { data: settings } = await supabase
      .from('business_settings')
      .select('invoice_prefix, invoice_start_number')
      .eq('user_id', job.user_id)
      .single()

    // Get count of existing invoices to determine next number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', job.user_id)

    // Generate invoice number
    const invoicePrefix = settings?.invoice_prefix || 'INV'
    const startNumber = settings?.invoice_start_number || 1
    const nextNumber = (count || 0) + startNumber
    const invoiceNumber = `${invoicePrefix}${String(nextNumber).padStart(5, '0')}`

    // Create invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: job.user_id,
        job_id,
        quote_id: quote_id || null,
        invoice_number: invoiceNumber,
        invoice_date,
        due_date,
        line_items,
        subtotal,
        tax,
        total,
        notes,
        terms,
        status: status || 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating invoice:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        { error: insertError.message || 'Failed to create invoice' },
        { status: 500 }
      )
    }

    // If converted from quote, update quote status
    if (quote_id) {
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'invoiced' })
        .eq('id', quote_id)

      if (updateError) {
        console.error('Error updating quote status:', updateError)
        // Don't fail the entire operation if this secondary update fails
      }
    }

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
