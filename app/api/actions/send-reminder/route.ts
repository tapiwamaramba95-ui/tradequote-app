import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, message } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get invoice details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        jobs!job_id (
          job_name,
          clients!client_id (
            name,
            email
          )
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // TODO: Send email reminder
    // Integrate with email service (Resend, SendGrid, etc.)
    console.log('Would send reminder email to:', invoice.jobs?.clients?.email)
    console.log('Invoice:', invoice.invoice_number, 'Amount:', invoice.total)

    // Log communication
    await supabase.from('client_communications').insert({
      user_id: invoice.user_id,
      client_id: invoice.jobs?.clients?.id,
      related_type: 'invoice',
      related_id: invoiceId,
      communication_type: 'reminder',
      method: 'email',
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      message: message || 'This is a friendly reminder that payment is due.',
    })

    // Update invoice
    await supabase
      .from('invoices')
      .update({
        last_reminder_sent: new Date().toISOString(),
        reminder_count: (invoice.reminder_count || 0) + 1,
      })
      .eq('id', invoiceId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
