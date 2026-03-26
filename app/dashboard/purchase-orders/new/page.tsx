'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import { useRouter } from 'next/navigation'
import NoteTemplateSelector from '@/components/NoteTemplateSelector'
import PriceListBrowser from '@/components/PriceListBrowser'

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

type Supplier = {
  id: string
  name: string
}

type Job = {
  id: string
  job_number: string
  job_name: string
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPriceList, setShowPriceList] = useState(false)

  // Form data
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ])

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) return

      // Load suppliers
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (suppliersData) setSuppliers(suppliersData)

      // Load jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, job_number, job_name')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (jobsData) setJobs(jobsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addLineItem = () => {
    const newId = String(lineItems.length + 1)
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const handlePriceListSelect = (item: any, costPrice: number) => {
    const newId = String(lineItems.length + 1)
    const newItem = {
      id: newId,
      description: `${item.name}${item.description ? ' - ' + item.description : ''}`,
      quantity: 1,
      unit_price: costPrice,
      total: costPrice
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price
        }
        return updated
      }
      return item
    }))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.1 // 10% GST
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get next PO number
      const { data: poNumberData } = await supabase.rpc('get_next_po_number', { p_user_id: user.id })
      const poNumber = poNumberData || 'PO0001'

      const { subtotal, tax, total } = calculateTotals()

      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: user.id,
          po_number: poNumber,
          supplier_id: selectedSupplier || null,
          job_id: selectedJob || null,
          order_date: orderDate,
          delivery_date: deliveryDate || null,
          line_items: lineItems,
          subtotal,
          tax,
          total,
          notes,
          delivery_instructions: deliveryInstructions,
          status: 'draft',
        })
        .select()
        .single()

      if (error) {
        alert('Failed to create purchase order: ' + error.message)
      } else {
        router.push(`/dashboard/purchase-orders/${data.id}`)
      }
    } catch (error) {
      alert('Error creating purchase order')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
          New Purchase Order
        </h1>
      </div>

      {/* Form */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          Purchase Order Information
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Supplier *
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
              }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          {/* Job (for cost tracking) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Link to Job (for cost tracking)
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
              }}
            >
              <option value="">No Job (General Purchase)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.job_number || job.job_name || 'Untitled Job'}</option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              Link to a job to track costs and calculate profit
            </p>
          </div>

          {/* Order Date */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Order Date
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
              }}
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
              }}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            Line Items
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPriceList(true)}
              className="px-3 py-1 rounded-md text-sm font-medium border"
              style={{ 
                color: colors.accent.DEFAULT,
                borderColor: colors.accent.DEFAULT,
                backgroundColor: colors.background.card
              }}
            >
              📋 Add from Price List
            </button>
            <button
              onClick={addLineItem}
              className="px-3 py-1 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              + Add Line
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: colors.border.light }}>
                <th className="text-left py-2 font-medium" style={{ color: colors.text.secondary }}>Description</th>
                <th className="text-left py-2 font-medium w-24" style={{ color: colors.text.secondary }}>Qty</th>
                <th className="text-left py-2 font-medium w-32" style={{ color: colors.text.secondary }}>Unit Price</th>
                <th className="text-right py-2 font-medium w-32" style={{ color: colors.text.secondary }}>Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <tr key={item.id} className="border-b" style={{ borderColor: colors.border.light }}>
                  <td className="py-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                    />
                  </td>
                  <td className="py-3 text-right font-semibold" style={{ color: colors.text.primary }}>
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-sm hover:underline"
                        style={{ color: colors.semantic.error }}
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.text.secondary }}>Subtotal:</span>
              <span style={{ color: colors.text.primary }}>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.text.secondary }}>GST (10%):</span>
              <span style={{ color: colors.text.primary }}>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: colors.border.light }}>
              <span style={{ color: colors.text.primary }}>Total:</span>
              <span style={{ color: colors.accent.DEFAULT }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          Additional Information
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Delivery Instructions
          </label>
          <textarea
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            rows={2}
            placeholder="Any special delivery instructions..."
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: colors.border.DEFAULT,
              backgroundColor: colors.background.card,
              color: colors.text.primary,
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>
              Notes
            </label>
            <NoteTemplateSelector onSelect={(content) => setNotes(content)} />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes..."
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: colors.border.DEFAULT,
              backgroundColor: colors.background.card,
              color: colors.text.primary,
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-md text-sm font-medium border"
          style={{
            borderColor: colors.border.DEFAULT,
            backgroundColor: colors.background.card,
            color: colors.text.primary,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          {saving ? 'Creating...' : 'Create Purchase Order'}
        </button>
      </div>

      <PriceListBrowser
        show={showPriceList}
        onClose={() => setShowPriceList(false)}
        onSelect={handlePriceListSelect}
        applyMarkup={false}
      />
    </div>
  )
}
