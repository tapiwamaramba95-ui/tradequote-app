'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'
import AddressInput from '@/components/AddressInput'

type EnquirySettings = {
  user_id: string
  public_profile_name: string
  company_logo_url: string | null
  form_fields: string[]
}

export default function PublicEnquiryFormPage({ params }: { params: Promise<{ publicProfileName: string }> }) {
  const { publicProfileName } = use(params)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState<EnquirySettings | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    street_address: '',
    suburb: '',
    state: '',
    postcode: '',
    description: '',
    job_type: '',
    preferred_date: '',
  })

  // Memoize the address change handlers
  const handleAddressChange = useCallback((address: string) => {
    setFormData(prev => ({ ...prev, customer_address: address }))
  }, [])

  const handleStructuredAddressChange = useCallback((structured: any) => {
    setFormData(prev => ({ 
      ...prev, 
      street_address: structured.street || '',
      suburb: structured.suburb || '',
      state: structured.state || '',
      postcode: structured.postcode || ''
    }))
  }, [])

  useEffect(() => {
    loadSettings()
  }, [publicProfileName])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiry_settings')
        .select('user_id, public_profile_name, company_logo_url, form_fields')
        .eq('public_profile_name', publicProfileName)
        .eq('form_enabled', true)
        .single()

      if (data) {
        setSettings(data)
      } else {
        setSettings(null)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setSubmitting(true)

    try {
      console.log('Submitting enquiry with address:', formData.customer_address)
      
      // Step 1: Find or create client
      let clientId: string | null = null
      
      // Try to find existing client by email or phone
      if (formData.customer_email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', settings.user_id)
          .eq('email', formData.customer_email)
          .single()
        
        if (existingClient) {
          clientId = existingClient.id
        }
      }
      
      // If no client found, create new one
      if (!clientId) {
        const clientData = {
          user_id: settings.user_id,
          name: formData.customer_name,
          email: formData.customer_email || null,
          phone: formData.customer_phone || null,
          address: formData.customer_address || null,
          street_address: formData.street_address || null,
          suburb: formData.suburb || null,
          state: formData.state || null,
          postcode: formData.postcode || null,
        }
        console.log('Creating client with data:', clientData)
        
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert(clientData)
          .select('id')
          .single()
        
        if (clientError || !newClient) {
          console.error('Error creating client:', clientError)
          alert('Failed to submit enquiry. Please try again.')
          setSubmitting(false)
          return
        }
        
        clientId = newClient.id
      }
      
      // Step 2: Create job with status='enquiry' 
      const jobData = {
        user_id: settings.user_id,
        client_id: clientId,
        job_name: formData.job_type || 'New Enquiry',
        street_address: formData.street_address || null,
        suburb: formData.suburb || null,
        state: formData.state || null,
        postcode: formData.postcode || null,
        description: formData.description,
        enquiry_source: 'website_form',
        enquiry_date: new Date().toISOString(),
        status: 'enquiry',
      }
      console.log('Creating job with data:', jobData)
      
      const { error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)

      if (!jobError) {
        setSubmitted(true)
      } else {
        console.error('Error creating job:', jobError, jobError.message, jobError.details)
        alert(`Failed to submit enquiry: ${jobError.message || 'Please try again.'}`)
      }
    } catch (error) {
      alert('Error submitting enquiry')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-900">Form not found</p>
          <p className="text-sm text-gray-500 mt-2">This enquiry form is not available.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Thank You!
          </h1>
          <p className="text-gray-600">
            Your enquiry has been submitted successfully. We'll be in touch soon.
          </p>
        </div>
      </div>
    )
  }

  const hasField = (field: string) => settings.form_fields.includes(field)

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {settings.company_logo_url && (
            <img src={settings.company_logo_url} alt="Company Logo" className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Request a Quote
          </h1>
          <p className="text-gray-600">
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name */}
              {hasField('name') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              )}

              {/* Email */}
              {hasField('email') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={(e) => {
                      const normalized = normalizeEmail(e.target.value)
                      setFormData({ ...formData, customer_email: normalized })
                    }}
                    onBlur={(e) => {
                      const suggestion = suggestEmailCorrection(e.target.value)
                      if (suggestion && suggestion !== e.target.value) {
                        if (confirm(`Did you mean ${suggestion}?`)) {
                          setFormData({ ...formData, customer_email: suggestion })
                        }
                      }
                    }}
                    placeholder="example@email.com"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              )}

              {/* Phone */}
              {hasField('phone') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    onBlur={(e) => {
                      const formatted = formatAustralianPhone(e.target.value)
                      setFormData({ ...formData, customer_phone: formatted })
                    }}
                    placeholder="0412 345 678"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              )}

              {/* Address */}
              {hasField('address') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Address
                  </label>
                  <AddressInput
                    value={formData.customer_address}
                    onChange={handleAddressChange}
                    onStructuredChange={handleStructuredAddressChange}
                    initialStructured={{
                      street_address: formData.street_address,
                      suburb: formData.suburb,
                      state: formData.state,
                      postcode: formData.postcode
                    }}
                    placeholder="Job location"
                  />
                </div>
              )}

              {/* Description */}
              {hasField('description') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    What do you need help with? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please describe what you need..."
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              )}

              {/* Preferred Date */}
              {hasField('preferred_date') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">When would you like this work to be done?</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-3 rounded-md font-medium text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
