import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

// GET - Fetch all payments for an invoice
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoice_id')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error in GET /api/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Record a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invoice_id,
      amount,
      payment_date,
      payment_method,
      reference_number,
      notes,
    } = body

    // Validate required fields
    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'payment_method is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Get invoice details to verify it exists and get user_id
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, user_id, total, amount_paid')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Validate payment amount doesn't exceed remaining balance
    const remainingBalance = invoice.total - (invoice.amount_paid || 0)
    if (amount > remainingBalance) {
      return NextResponse.json(
        {
          error: 'Payment amount exceeds remaining balance',
          remaining_balance: remainingBalance
        },
        { status: 400 }
      )
    }

    // Create payment record
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: invoice.user_id,
        invoice_id: invoice_id,
        amount: parseFloat(amount),
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        payment_method: payment_method,
        reference_number: reference_number || null,
        notes: notes || null,
        created_by: invoice.user_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating payment:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to record payment' },
        { status: 500 }
      )
    }

    // The trigger will automatically update invoice.amount_paid and status
    // But let's fetch the updated invoice to return it
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single()

    return NextResponse.json({
      payment,
      invoice: updatedInvoice,
      message: 'Payment recorded successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a payment (admin correction)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'payment_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Get payment details before deletion for the invoice update
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('invoice_id')
      .eq('id', paymentId)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Delete the payment (trigger will update invoice automatically)
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      console.error('Error deleting payment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete payment' },
        { status: 500 }
      )
    }

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', payment.invoice_id)
      .single()

    return NextResponse.json({
      message: 'Payment deleted successfully',
      invoice: updatedInvoice
    })
  } catch (error) {
    console.error('Error in DELETE /api/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
