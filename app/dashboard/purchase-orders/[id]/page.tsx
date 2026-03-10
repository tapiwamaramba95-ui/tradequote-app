import Link from 'next/link'
import POActions from '@/components/POActions'

type Props = { params: { id: string } }

export default async function PurchaseOrderPage({ params }: Props) {
  const id = params.id
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/purchase-orders/${id}`, { cache: 'no-store' })
  if (!res.ok) return <div className="text-red-600">Could not load purchase order</div>
  const po = await res.json()

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Order {po?.reference ?? id}</h1>
        <Link href="/dashboard/purchase-orders" className="text-sm text-muted-foreground">Back</Link>
      </div>

      <div className="mt-6 space-y-4">
        <div className="border rounded p-4">
          <p><strong>Supplier:</strong> {po?.suppliers?.name ?? po?.supplier_id}</p>
          <p><strong>Reference:</strong> {po?.reference}</p>
          <p><strong>Status:</strong> {po?.status}</p>
          <p><strong>Total:</strong> {po?.total}</p>
          <div className="mt-4">
            <POActions poId={id} />
          </div>

          {po?.invoices && po.invoices.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Invoices</h3>
              <ul className="mt-2">
                {po.invoices.map((inv: any) => (
                  <li key={inv.id}>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-accent">{inv.reference ?? inv.id}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {po?.grns && po.grns.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">GRNs</h3>
              <ul className="mt-2">
                {po.grns.map((g: any) => (
                  <li key={g.id}><Link href={`/dashboard/grns/${g.id}`} className="text-accent">GRN {g.id}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
