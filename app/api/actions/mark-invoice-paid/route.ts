import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, paidDate, paymentMethod } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update invoice to paid status
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: paidDate || new Date().toISOString(),
        payment_method: paymentMethod || 'other',
        amount_paid: (await supabase.from('invoices').select('total').eq('id', invoiceId).single()).data?.total || 0,
      })
      .eq('id', invoiceId)

    if (error) throw error

    // This will trigger the job totals recalculation via database triggers
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking invoice paid:', error)
    return NextResponse.json({ error: 'Failed to mark invoice as paid' }, { status: 500 })
  }
}
