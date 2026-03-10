import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseAdmin()

  const { data: po, error: poErr } = await supabase.from('purchase_orders').select('*').eq('id', id).single()
  if (poErr || !po) return NextResponse.json({ error: poErr?.message || 'PO not found' }, { status: 404 })

  const grn = {
    purchase_order_id: po.id,
    supplier_id: po.supplier_id,
    received_at: new Date().toISOString(),
    total: po.total,
    status: 'received',
  }

  const { data, error } = await supabase.from('grns').insert([grn]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('purchase_orders').update({ status: 'received' }).eq('id', id)

  return NextResponse.json({ grn: data })
}
