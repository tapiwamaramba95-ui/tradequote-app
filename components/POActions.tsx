"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { poId: string }

export default function POActions({ poId }: Props) {
  const router = useRouter()
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingGrn, setLoadingGrn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createInvoice() {
    setError(null)
    setLoadingInvoice(true)
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/create-invoice`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to create invoice')
      const id = body?.invoice?.id
      if (id) router.push(`/dashboard/invoices/${id}`)
    } catch (err: any) {
      setError(err.message || 'Create invoice failed')
    } finally {
      setLoadingInvoice(false)
    }
  }

  async function createGrn() {
    setError(null)
    setLoadingGrn(true)
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/create-grn`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to create GRN')
      const id = body?.grn?.id
      if (id) router.push(`/dashboard/grns/${id}`)
    } catch (err: any) {
      setError(err.message || 'Create GRN failed')
    } finally {
      setLoadingGrn(false)
    }
  }

  return (
    <div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex gap-2">
        <button onClick={createInvoice} disabled={loadingInvoice} className="inline-flex items-center rounded bg-accent px-3 py-1 text-sm text-white">
          {loadingInvoice ? 'Creating invoice…' : 'Create Invoice'}
        </button>
        <button onClick={createGrn} disabled={loadingGrn} className="inline-flex items-center rounded border px-3 py-1 text-sm">
          {loadingGrn ? 'Creating GRN…' : 'Create GRN'}
        </button>
      </div>
    </div>
  )
}
