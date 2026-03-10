import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseAdmin()

  // fetch PO
  const { data: po, error: poErr } = await supabase.from('purchase_orders').select('*').eq('id', id).single()
  if (poErr || !po) return NextResponse.json({ error: poErr?.message || 'PO not found' }, { status: 404 })

  // create invoice payload (minimal)
  const invoice = {
    supplier_id: po.supplier_id,
    reference: `INV-from-PO-${po.id}`,
    total: po.total,
    status: 'draft',
    source_purchase_order_id: po.id,
  }

  const { data, error } = await supabase.from('invoices').insert([invoice]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // optionally update PO status
  await supabase.from('purchase_orders').update({ status: 'converted' }).eq('id', id)

  return NextResponse.json({ invoice: data })
}
