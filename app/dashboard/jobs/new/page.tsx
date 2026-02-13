'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
import Link from 'next/link'

type Client = {
  id: string
  name: string
  address: string
  email: string
  phone: string
}

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    address: '',
    scheduled_date: '',
    description: '',
    status: 'quoted',
    total_amount: '',
    reference: '',
  })

  // Fetch clients on load
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    setClients(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in')
      return
    }

    const { error } = await supabase
      .from('jobs')
      .insert([
        {
          user_id: user.id,
          title: formData.title,
          client_id: formData.client_id || null,
          address: formData.address,
          scheduled_date: formData.scheduled_date || null,
          description: formData.description,
          status: formData.status,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        }
      ])

    if (error) {
      alert('Error creating job: ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/jobs')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const selectClient = (client: Client) => {
    setFormData({
      ...formData,
      client_id: client.id,
      address: client.address || formData.address,
    })
    setClientSearch(client.name)
    setShowClientDropdown(false)
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const selectedClient = clients.find(c => c.id === formData.client_id)

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: colors.text.muted }}>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/jobs" className="hover:underline">Jobs</Link>
          <span>/</span>
          <span>New Job</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
          New Job
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Information Card */}
            <div 
              className="rounded-lg border shadow-sm"
              style={{
                backgroundColor: colors.background.card,
                borderColor: colors.border.DEFAULT,
              }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Job Information
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Customer Search */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Customer *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value)
                          setShowClientDropdown(true)
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Search or Add Customer"
                        className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                        style={{
                          borderColor: colors.border.DEFAULT,
                          backgroundColor: colors.background.card,
                          color: colors.text.primary,
                        }}
                      />
                      
                      {/* Dropdown */}
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div 
                          className="absolute z-10 w-full mt-1 rounded-md shadow-lg border max-h-60 overflow-auto"
                          style={{
                            backgroundColor: colors.background.card,
                            borderColor: colors.border.DEFAULT,
                          }}
                        >
                          {filteredClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => selectClient(client)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-sm" style={{ color: colors.text.primary }}>
                                {client.name}
                              </div>
                              {client.email && (
                                <div className="text-xs" style={{ color: colors.text.muted }}>
                                  {client.email}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Link
                      href="/dashboard/clients/new"
                      className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.accent.DEFAULT,
                      }}
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </Link>
                  </div>
                  
                  {selectedClient && (
                    <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: colors.background.main }}>
                      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        {selectedClient.name}
                      </div>
                      {selectedClient.phone && (
                        <div className="text-xs" style={{ color: colors.text.secondary }}>
                          {selectedClient.phone}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="E.g. Kitchen Renovation, Roof Repair"
                    className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                    onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                  />
                </div>

                {/* Address & Reference Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Job site address"
                      autoComplete="street-address"
                      className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Reference
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="Job reference or PO number"
                      className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    />
                  </div>
                </div>

                {/* Scheduled Date & Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      name="scheduled_date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    >
                      <option value="quoted">Quoted</option>
                      <option value="approved">Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Estimated Value */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Estimated Value
                  </label>
                  <div className="relative">
                    <span 
                      className="absolute left-3 top-2 text-sm"
                      style={{ color: colors.text.muted }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm pl-7 pr-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the scope of work..."
                    className="w-full rounded-md shadow-sm focus:ring-2 focus:outline-none text-sm px-3 py-2 border transition-colors"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                    onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                  />
                </div>
              </div>
            </div>

            {/* Expandable Sections (For Later) */}
            <div 
              className="rounded-lg border-2 border-dashed p-6 text-center"
              style={{ borderColor: colors.border.DEFAULT }}
            >
              <p className="text-sm" style={{ color: colors.text.muted }}>
                Additional sections coming soon: Custom Fields, Job Contacts, Site Contacts
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div 
              className="rounded-lg border shadow-sm"
              style={{
                backgroundColor: colors.background.card,
                borderColor: colors.border.DEFAULT,
              }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
                <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>
                  Quick Actions
                </h3>
              </div>
              
              <div className="p-4 space-y-3">
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT 
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
                    >
                      <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        Schedule & Assign Staff
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                        Coming in Week 2
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT 
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
                    >
                      <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        Create Documents
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                        Quote & Invoice generation in Week 3
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div 
              className="rounded-lg p-4"
              style={{ backgroundColor: `${colors.accent.DEFAULT}08`, border: `1px solid ${colors.accent.DEFAULT}30` }}
            >
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    Building Phase
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                    More features will be added as you progress through the 30-day build plan!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div 
          className="sticky bottom-0 mt-6 px-6 py-4 rounded-lg border shadow-lg flex items-center justify-between"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md border text-sm font-medium transition-colors"
            style={{
              borderColor: colors.border.DEFAULT,
              backgroundColor: colors.background.card,
              color: colors.text.primary,
            }}
          >
            Cancel
          </button>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                backgroundColor: colors.accent.DEFAULT,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
            >
              {loading ? 'Saving...' : 'Save Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}