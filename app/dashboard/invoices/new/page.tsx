'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { useRouter, useSearchParams } from 'next/navigation'
import { DollarSign, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import NoteTemplateSelector from '@/components/NoteTemplateSelector'
import PriceListBrowser from '@/components/PriceListBrowser'
import Breadcrumb from '@/components/Breadcrumb'

type LineItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

type Job = {
  id: string
  job_number: string
  job_name: string
  client_id: string
  clients: {
    name: string
  }[]
}

type Quote = {
  id: string
  quote_number: string
  line_items: LineItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  terms?: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('from_quote') || searchParams.get('quote')
  
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [clientName, setClientName] = useState('') // Store client name when loading from quote
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(10.0) // Default to 10%
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Payment due within 30 days')
  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId)
  const [showPriceList, setShowPriceList] = useState(false)

  // Fetch business settings for tax rate
  const fetchBusinessSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('business_settings')
          .select('default_tax_rate')
          .eq('user_id', user.id)
          .single()
        
        if (data?.default_tax_rate) {
          setTaxRate(data.default_tax_rate)
        }
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchBusinessSettings()
    if (quoteId) {
      loadQuoteData()
    } else {
      // Set default due date (30 days from now)
      const due = new Date()
      due.setDate(due.getDate() + 30)
      setDueDate(due.toISOString().split('T')[0])
    }
  }, [])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        job_name,
        client_id,
        clients!client_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setJobs(data)
    }
  }

  const loadQuoteData = async () => {
    if (!quoteId) return

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        jobs!job_id (
          id,
          job_number,
          job_name,
          client_id,
          clients!client_id (
            name
          )
        )
      `)
      .eq('id', quoteId)
      .single()

    if (!error && quote) {
      setSelectedJobId(quote.jobs?.id || '')
      setClientName(quote.jobs?.clients?.name || 'Unknown Client')
      setLineItems(quote.line_items || [])
      setNotes(quote.notes || '')
      setTerms(quote.terms || 'Payment due within 30 days')
      
      // Set default due date
      const due = new Date()
      due.setDate(due.getDate() + 30)
      setDueDate(due.toISOString().split('T')[0])
    }

    setLoadingQuote(false)
  }

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id)), 0) + 1).toString()
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }])
  }
  const handlePriceListSelect = (item: any, calculatedPrice: number) => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString()
    const newItem = {
      id: newId,
      description: `${item.name}${item.description ? ' - ' + item.description : ''}`,
      quantity: 1,
      rate: calculatedPrice,
      amount: calculatedPrice
    }
    setLineItems([...lineItems, newItem])
  }
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate
          }
          return updated
        }
        return item
      })
    )
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(items => items.filter(item => item.id !== id))
    }
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleSubmit = async () => {
    if (!selectedJobId) {
      alert('Please select a job')
      return
    }

    if (lineItems.some(item => !item.description)) {
      alert('Please fill in all line item descriptions')
      return
    }

    setLoading(true)

    try {
      const { subtotal, tax, total } = calculateTotals()

      // Call API endpoint to create invoice
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: selectedJobId,
          quote_id: quoteId || null,
          invoice_date: invoiceDate,
          due_date: dueDate,
          line_items: lineItems,
          subtotal,
          tax,
          total,
          notes,
          terms,
          status: 'draft'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create invoice')
      }

      const { invoice } = await response.json()
      
      // Update job status to invoiced
      if (selectedJobId) {
        await supabase
          .from('jobs')
          .update({ status: 'invoiced' })
          .eq('id', selectedJobId)
      }
      
      // If converted from a quote, mark quote as invoiced
      if (quoteId) {
        await supabase
          .from('quotes')
          .update({ status: 'invoiced' })
          .eq('id', quoteId)
      }
      
      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert(error instanceof Error ? error.message : 'Failed to create invoice')
      setLoading(false)
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  if (loadingQuote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'New Invoice' }
      ]} />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {quoteId ? 'Convert Quote to Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {quoteId ? 'Invoice details pre-filled from quote' : 'Bill your client for completed work'}
          </p>
        </div>
      </div>

      {/* Conversion Banner */}
      {quoteId && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46'
        }}>
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Pre-filled from accepted quote. Review and adjust before saving.</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Job Selection */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
            Invoice Details
          </h2>

          {/* Client Display (when converting from quote) */}
          {quoteId && clientName && (
            <div className="mb-4 p-3 rounded-md" style={{
              backgroundColor: colors.background.hover,
              border: `1px solid ${colors.border.DEFAULT}`
            }}>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.text.secondary }}>
                Client
              </label>
              <div className="text-base font-semibold" style={{ color: colors.text.primary }}>
                {clientName}
              </div>
              <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                Invoice will be created for this client
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Job *
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
                disabled={!!quoteId}
              >
                <option value="">Select a job</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.job_number || job.job_name || 'Untitled Job'}{job.clients?.[0]?.name ? ` - ${job.clients[0].name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Line Items
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPriceList(true)}
                className="text-sm font-medium px-3 py-1 rounded border hover:bg-gray-50"
                style={{ color: colors.accent.DEFAULT, borderColor: colors.accent.DEFAULT }}
              >
                📋 Add from Price List
              </button>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-cyan-100 hover:bg-cyan-200 transition-colors"
                style={{ color: colors.accent.DEFAULT }}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 p-3 rounded"
                style={{ backgroundColor: colors.background.main }}
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <div
                    className="w-full rounded border px-2 py-1 text-sm font-semibold text-right"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.accent.DEFAULT,
                    }}
                  >
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.text.secondary }}>Subtotal:</span>
                <span style={{ color: colors.text.primary }}>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.text.secondary }}>Tax (GST {taxRate}%):</span>
                <span style={{ color: colors.text.primary }}>${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div
                className="flex justify-between text-lg font-bold pt-2 border-t"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <span style={{ color: colors.text.primary }}>Total:</span>
                <span style={{ color: colors.accent.DEFAULT }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="space-y-4">
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
                placeholder="Additional notes for the client..."
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
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
      </div>

      {/* Actions */}
      <div
        className="sticky bottom-0 mt-6 py-4 px-6 flex justify-between items-center border-t"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <Link
          href="/dashboard/invoices"
          className="px-4 py-2 text-sm font-medium hover:underline"
          style={{ color: colors.text.secondary }}
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 rounded-md text-sm font-medium text-white shadow-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>

      <PriceListBrowser
        show={showPriceList}
        onClose={() => setShowPriceList(false)}
        onSelect={handlePriceListSelect}
        applyMarkup={true}
      />
    </div>
  )
}