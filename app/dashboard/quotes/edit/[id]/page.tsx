'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/StatusBadge'
import Breadcrumb from '@/components/Breadcrumb'
import { getBusinessId } from '@/lib/business'

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
}

type Client = {
  id: string
  name: string
  email: string
}

export default function EditQuotePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [taxRate, setTaxRate] = useState(10) // Default tax rate
  const [formData, setFormData] = useState({
    client_id: '',
    job_id: '',
    notes: '',
    terms: '',
    valid_until: ''
  })

  useEffect(() => {
    fetchQuote()
    fetchBusinessSettings()
    fetchJobs()
    fetchClients()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_settings')
        .select('default_tax_rate')
        .eq('user_id', user.id)
        .single()

      if (data?.default_tax_rate) {
        setTaxRate(data.default_tax_rate)
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, job_number, job_name')
      .order('created_at', { ascending: false })
    
    setJobs(data || [])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email')
      .order('name', { ascending: true })
    
    setClients(data || [])
  }

  const fetchQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found for user')
        setLoading(false)
        return
      }

      console.log('Fetching quote for edit:', params.id, 'for business:', businessId)

      // Pre-check: Get quote metadata to test access
      const { data: checkData } = await supabase
        .from('quotes')
        .select('id, quote_number, business_id')
        .eq('id', params.id)
        .maybeSingle()

      if (checkData) {
        console.log('Quote exists:', checkData.quote_number, 'business_id:', checkData.business_id)
        
        // Auto-update if business_id doesn't match
        if (checkData.business_id !== businessId) {
          console.log('Updating quote business_id from', checkData.business_id, 'to', businessId)
          await supabase
            .from('quotes')
            .update({ business_id: businessId })
            .eq('id', checkData.id)
        }
      } else {
        console.log('Quote does not exist:', params.id)
      }

      // Main query with business_id filter
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!client_id (
            id,
            name,
            email
          ),
          jobs!job_id (
            id,
            job_name,
            job_number,
            clients!client_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('id', params.id)
        .eq('business_id', businessId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching quote:', error, JSON.stringify(error))
        setLoading(false)
        return
      }

      if (!data) {
        console.error('Quote not found after business_id check/update')
        setLoading(false)
        return
      }

      console.log('Quote found for editing:', data.quote_number)
      setQuote(data)
      // Ensure line items have unique IDs for React keys
      const items = data.line_items || [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]
      const itemsWithIds = items.map((item: any, index: number) => ({
        ...item,
        id: item.id || `line-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
      }))
      console.log('Line items with IDs:', itemsWithIds.map(i => ({ id: i.id, description: i.description })))
      setLineItems(itemsWithIds)
      setFormData({
        client_id: data.client_id || '',
        job_id: data.job_id || '',
        notes: data.notes || '',
        terms: data.terms || '',
        valid_until: data.valid_until ? data.valid_until.split('T')[0] : ''
      })
    } catch (err) {
      console.error('Exception fetching quote:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    console.log('Updating line item:', id, field, value)
    console.log('Current line items:', lineItems.map(i => ({ id: i.id, [field]: i[field] })))
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate)
        }
        return updated
      }
      return item
    }))
  }

  const addLineItem = () => {
    const newId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setLineItems([...lineItems, { 
      id: newId, 
      description: '', 
      quantity: 1, 
      rate: 0, 
      amount: 0 
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSave = async () => {
    if (!quote) return

    // Validate required fields
    if (!formData.client_id) {
      alert('Please select a client before saving the quote')
      return
    }

    // Validate line items
    const validLineItems = lineItems.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0)
    if (validLineItems.length === 0) {
      alert('Please add at least one line item with description, quantity, and rate')
      return
    }

    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const tax = calculateTax()
      const total = calculateTotal()

      const { error } = await supabase
        .from('quotes')
        .update({
          client_id: formData.client_id,
          job_id: formData.job_id || null,
          line_items: lineItems,
          subtotal,
          tax,
          total,
          notes: formData.notes,
          terms: formData.terms,
          valid_until: formData.valid_until,
          status: 'draft' // Reset to draft when edited
        })
        .eq('id', params.id)

      if (error) {
        alert('Error updating quote: ' + error.message)
      } else {
        alert('Quote updated successfully!')
        router.push(`/dashboard/quotes/${params.id}`)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Quote not found.
        </div>
      </div>
    )
  }

  // Check if quote can be edited
  const isEditable = quote.status === 'draft' || quote.status === 'sent' || quote.status === 'declined'
  
  if (!isEditable) {
    return (
      <div className="p-8">
        <Breadcrumb items={[
          { label: 'Quotes', href: '/dashboard/quotes' },
          { label: quote.quote_number, href: `/dashboard/quotes/${quote.id}` },
          { label: 'Edit' }
        ]} />
        
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This quote cannot be edited because it has been <StatusBadge status={quote.status} />
          </div>
          <p className="mt-2 text-sm">
            {quote.status === 'accepted' && 'Accepted quotes cannot be edited. You can cancel the quote and create a new one.'}\n            {quote.status === 'cancelled' && 'Cancelled quotes cannot be edited.'}\n            {quote.status === 'expired' && 'Expired quotes cannot be edited.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="p-6 sm:p-8 max-w-5xl mx-auto">
        
        <Breadcrumb items={[
          { label: 'Quotes', href: '/dashboard/quotes' },
          { label: `Quote #${quote?.quote_number || 'Loading...'}`, href: `/dashboard/quotes/${quote.id}` },
          { label: 'Edit' }
        ]} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Quote {quote.quote_number}</h1>
            <p className="text-gray-600 mt-1">
              {quote.clients?.name} • Created {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {/* Client Selection */}
            <div className="mb-6">
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
                Select Client *
              </label>
              <select
                name="client_id"
                id="client_id"
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Job Selection */}
            <div className="mb-6">
              <label htmlFor="job_id" className="block text-sm font-medium text-gray-700 mb-2">
                Link to Job (Optional)
              </label>
              <select
                name="job_id"
                id="job_id"
                value={formData.job_id}
                onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">No job linked</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_number || job.job_name || 'Untitled Job'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quote Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  + Add Line
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="0"
                        step="0.01"
                        value={item.quantity || 0}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Rate"
                        min="0"
                        step="0.01"
                        value={item.rate || 0}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={`$${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div className="col-span-1">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium">${calculateTax().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Add notes for this quote..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}