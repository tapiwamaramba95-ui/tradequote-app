'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Plus, Trash2 } from 'lucide-react'
import NoteTemplateSelector from '@/components/NoteTemplateSelector'
import PriceListBrowser from '@/components/PriceListBrowser'
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

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job_id')
  
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showPriceList, setShowPriceList] = useState(false)
  const [taxRate, setTaxRate] = useState(10) // Default tax rate
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [formData, setFormData] = useState({
    client_id: '',
    job_id: jobId || '',
    notes: '',
    terms: 'Payment due within 30 days',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const fetchBusinessSettings = useCallback(async () => {
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
  }, [])

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, job_number, job_name')
      .order('created_at', { ascending: false })
      .limit(1000)
    
    setJobs(data || [])
  }, [])

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email')
      .order('name', { ascending: true })
      .limit(1000)
    
    setClients(data || [])
  }, [])

  const addLineItem = () => {
    const newId = String(lineItems.length + 1)
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const handlePriceListSelect = (item: any, calculatedPrice: number) => {
    const newId = String(lineItems.length + 1)
    const newItem = {
      id: newId,
      description: `${item.name}${item.description ? ' - ' + item.description : ''}`,
      quantity: 1,
      rate: calculatedPrice,
      amount: calculatedPrice
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
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

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.client_id) {
        alert('Please select a client before creating the quote')
        setLoading(false)
        return
      }

      // Validate line items
      const validLineItems = lineItems.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0)
      if (validLineItems.length === 0) {
        alert('Please add at least one line item with description, quantity, and rate')
        setLoading(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        setLoading(false)
        return
      }

      const businessId = await getBusinessId()
      if (!businessId) {
        alert('No business found for user')
        setLoading(false)
        return
      }

      // Fetch business settings to get quote numbering config
      const { data: settings } = await supabase
        .from('business_settings')
        .select('quote_prefix, quote_start_number')
        .eq('user_id', user.id)
        .single()

      // Get highest existing quote number to determine next number
      const { data: lastQuote } = await supabase
        .from('quotes')
        .select('quote_number')
        .eq('business_id', businessId)
        .like('quote_number', `${settings?.quote_prefix || 'Q'}%`)
        .order('quote_number', { ascending: false })
        .limit(1)
        .single()

      // Generate quote number
      const quotePrefix = settings?.quote_prefix || 'Q'
      const startNumber = settings?.quote_start_number || 1
      
      let nextNumber = startNumber
      if (lastQuote?.quote_number) {
        // Extract number from last quote (e.g., Q00005 -> 5)
        const numberMatch = lastQuote.quote_number.match(new RegExp(`^${quotePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`))
        if (numberMatch) {
          nextNumber = parseInt(numberMatch[1]) + 1
        }
      }
      
      const quoteNumber = `${quotePrefix}${String(nextNumber).padStart(4, '0')}`

      const subtotal = calculateSubtotal()
      const tax = calculateTax()
      const total = calculateTotal()

      const { error } = await supabase
        .from('quotes')
        .insert([
          {
            business_id: businessId,
            client_id: formData.client_id,
            job_id: formData.job_id || null,
            quote_number: quoteNumber,
            line_items: lineItems,
            subtotal,
            tax,
            total,
            notes: formData.notes,
            terms: formData.terms,
            valid_until: formData.valid_until,
            status: 'draft'
          }
        ])

      if (error) {
        alert('Error creating quote: ' + error.message)
        setLoading(false)
      } else {
        // ✅ Check if this is the first quote created
        const { count } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)

        // If this is the first quote, mark onboarding complete
        if (count === 1) {
          await supabase
            .from('onboarding_progress')
            .update({ 
              first_quote_created: true,
              completion_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
        }
        
        router.push('/dashboard/quotes')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-5xl">
      <Breadcrumb items={[
        { label: 'Quotes', href: '/dashboard/quotes' },
        { label: 'New Quote' }
      ]} />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Quote</h1>
          <p className="text-sm text-gray-500 mt-1">Generate a professional quote for your client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection - Required */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              Select Client *
            </label>
            <select
              name="client_id"
              id="client_id"
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Selection - Optional */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <label htmlFor="job_id" className="block text-sm font-medium text-gray-700 mb-2">
              Link to Job (Optional)
            </label>
            <select
              name="job_id"
              id="job_id"
              value={formData.job_id}
              onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">No job linked</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_number || job.job_name || 'Untitled Job'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPriceList(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                📋 Add from Price List
              </button>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-cyan-700 bg-cyan-100 hover:bg-cyan-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Line
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={`$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    disabled
                    className="block w-full rounded-md border-gray-300 bg-gray-50 sm:text-sm px-3 py-2 border text-gray-700"
                  />
                </div>
                <div className="col-span-1">
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
          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <div>
                <span className="text-gray-600">Tax:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="ml-2 w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-2 py-1 border"
                />
                <span className="ml-1 text-gray-600">%</span>
              </div>
              <span className="font-medium">${calculateTax().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <NoteTemplateSelector onSelect={(content) => setFormData({ ...formData, notes: content })} />
            </div>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information for the client..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
              Terms & Conditions
            </label>
            <textarea
              name="terms"
              id="terms"
              rows={2}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <input
              type="date"
              name="valid_until"
              id="valid_until"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quote'}
          </button>
        </div>
      </form>

      <PriceListBrowser
        show={showPriceList}
        onClose={() => setShowPriceList(false)}
        onSelect={handlePriceListSelect}
        applyMarkup={true}
      />
    </div>
  )
}