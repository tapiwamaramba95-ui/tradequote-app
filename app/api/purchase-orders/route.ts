
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
export async function GET(request: Request) {
  try {
    const url = new URL(request.url, 'http://localhost')
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const per_page = Math.max(1, Math.min(100, Number(url.searchParams.get('per_page') ?? 20)))
    const q = url.searchParams.get('q')
    const status = url.searchParams.get('status')
    const supplier_id = url.searchParams.get('supplier_id')

    const supabase = await createSupabaseServer()

    // include supplier name and related invoice/grn references
    let query = supabase
      .from('purchase_orders')
      .select('*, suppliers(id, name), invoices(id, reference), grns(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
    if (q) query = query.ilike('reference', `%${q}%`)
    if (status) query = query.eq('status', status)
    if (supplier_id) query = query.eq('supplier_id', supplier_id)

    const start = (page - 1) * per_page
    const end = start + per_page - 1
    const { data, error, count } = await query.range(start, end)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, count, page, per_page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createSupabaseServer()

    // basic server-side validation
    if (!body.supplier_id) return NextResponse.json({ error: 'supplier_id required' }, { status: 400 })
    if (!body.total) return NextResponse.json({ error: 'total required' }, { status: 400 })

    const { data, error } = await supabase.from('purchase_orders').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
