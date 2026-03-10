import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/invoices/final
 * Generate a final invoice for remaining balance after deposit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Fetch job details with quote
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        quotes!job_id (
          id,
          quote_number,
          total,
          line_items,
          notes,
          terms,
          tax_rate
        )
      `)
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const userId = job.user_id
    if (!userId) {
      return NextResponse.json(
        { error: 'Could not determine user for this job' },
        { status: 400 }
      )
    }

    // Get all invoices for this job to calculate total paid
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id, type, total, amount_paid')
      .eq('job_id', job_id)

    const totalPaid = existingInvoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0

    // Check if deposit invoice exists and is paid
    const depositInvoice = existingInvoices?.find(inv => inv.type === 'deposit')
    if (depositInvoice && depositInvoice.amount_paid < depositInvoice.total) {
      return NextResponse.json(
        { error: 'Deposit invoice must be paid before creating final invoice' },
        { status: 400 }
      )
    }

    // Check if final invoice already exists
    const finalInvoiceExists = existingInvoices?.some(inv => inv.type === 'final')
    if (finalInvoiceExists) {
      return NextResponse.json(
        { error: 'Final invoice already exists for this job' },
        { status: 400 }
      )
    }

    // Get the quote to use its line items
    const quote = job.quotes?.[0]
    if (!quote) {
      return NextResponse.json(
        { error: 'No quote found for this job' },
        { status: 404 }
      )
    }

    const jobTotal = parseFloat(job.total_amount) || parseFloat(quote.total) || 0
    const remainingBalance = jobTotal - totalPaid

    if (remainingBalance <= 0) {
      return NextResponse.json(
        { error: 'No remaining balance to invoice' },
        { status: 400 }
      )
    }

    // Get business settings for invoice numbering
    const { data: settings } = await supabase
      .from('business_settings')
      .select('invoice_prefix, invoice_start_number')
      .eq('user_id', userId)
      .single()

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const invoicePrefix = settings?.invoice_prefix || 'INV'
    const startNumber = settings?.invoice_start_number || 1
    const nextNumber = (count || 0) + startNumber
    const invoiceNumber = `${invoicePrefix}${String(nextNumber).padStart(5, '0')}`

    // Calculate tax components
    const taxRate = quote.tax_rate || 10
    const finalSubtotal = remainingBalance / (1 + taxRate / 100)
    const finalTax = remainingBalance - finalSubtotal

    // Use original quote line items but adjust description
    const finalLineItems = quote.line_items || []
    
    // Add a summary line item
    const summaryItem = {
      id: '999',
      description: `Final payment for ${job.title}\\n(Total project value: $${jobTotal.toFixed(2)} - Deposit paid: $${totalPaid.toFixed(2)})`,
      quantity: 1,
      rate: finalSubtotal,
      amount: finalSubtotal
    }

    // Create final invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        job_id: job_id,
        client_id: job.client_id,
        quote_id: quote.id,
        type: 'final',
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        line_items: [summaryItem, ...finalLineItems],
        subtotal: finalSubtotal,
        tax: finalTax,
        tax_rate: taxRate,
        total: remainingBalance,
        amount_paid: 0,
        notes: `Final invoice for ${job.title}\\n\\nJob total: $${jobTotal.toFixed(2)}\\nDeposit paid: $${totalPaid.toFixed(2)}\\nBalance due: $${remainingBalance.toFixed(2)}`,
        terms: quote.terms || 'Payment due within 30 days',
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating final invoice:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create final invoice' },
        { status: 500 }
      )
    }

    // Update job with final invoice reference
    await supabase
      .from('jobs')
      .update({
        final_invoice_id: invoice.id
      })
      .eq('id', job_id)

    return NextResponse.json({
      invoice,
      message: `Final invoice ${invoiceNumber} created successfully`,
      job_total: jobTotal,
      total_paid: totalPaid,
      remaining_balance: remainingBalance
    })
  } catch (error) {
    console.error('Error in POST /api/invoices/final:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
