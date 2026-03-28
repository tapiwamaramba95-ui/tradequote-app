'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'
import { AddressFields } from '@/components/AddressFields'
import { colors } from '@/lib/colors'
import { ChevronDown } from 'lucide-react'

type EnquirySettings = {
  user_id: string
  company_name: string
  company_logo_url: string | null
  form_enabled: boolean
  form_fields: string[]
}

export default function PublicEnquiryFormPage({ params }: { params: Promise<{ business_name: string }> }) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState<EnquirySettings | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    street_address: '',
    suburb: '',
    state: '',
    postcode: '',
    description: '',
    job_type: '',
    preferred_date: '',
    is_recurring: 'once-off',
    frequency: '',
    duration: '',
  })

  // Unwrap async params
  useEffect(() => {
    params.then(p => setBusinessName(p.business_name))
  }, [params])

  const loadSettings = useCallback(async () => {
    if (!businessName) return
    
    try {
      // Helper function to generate slug from company name
      const generateSlug = (name: string) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      }

      // Fetch all business settings to find matching company
      const { data: allBusinesses } = await supabase
        .from('business_settings')
        .select('user_id, company_name, company_logo_url')

      if (!allBusinesses || allBusinesses.length === 0) {
        setSettings(null)
        setLoading(false)
        return
      }

      // Find the business whose company name slug matches the URL
      const matchingBusiness = allBusinesses.find(business => 
        business.company_name && generateSlug(business.company_name) === businessName
      )

      if (!matchingBusiness) {
        setSettings(null)
        setLoading(false)
        return
      }

      // Check if enquiry form is enabled for this user
      const { data: enquiryData } = await supabase
        .from('enquiry_settings')
        .select('form_enabled, form_fields')
        .eq('user_id', matchingBusiness.user_id)
        .single()

      // Default to enabled with all fields if no settings exist
      const isEnabled = enquiryData ? (enquiryData.form_enabled ?? true) : true
      const fields = enquiryData?.form_fields || ['name', 'email', 'phone', 'address', 'description', 'job_type']

      if (isEnabled) {
        setSettings({
          user_id: matchingBusiness.user_id,
          company_name: matchingBusiness.company_name,
          company_logo_url: matchingBusiness.company_logo_url,
          form_enabled: isEnabled,
          form_fields: fields
        })
      } else {
        setSettings(null)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [businessName])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings || !businessName) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/enquiry/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName,
          customerName: formData.customer_name,
          customerEmail: formData.customer_email,
          customerPhone: formData.customer_phone,
          streetAddress: formData.street_address,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          description: formData.description,
          jobType: formData.job_type,
          isRecurring: formData.is_recurring,
          frequency: formData.frequency,
          duration: formData.duration,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitted(true)
      } else {
        console.error('Error submitting enquiry:', data.error, data.details)
        alert(`Failed to submit enquiry: ${data.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error)
      alert('Error submitting enquiry. Please try again.')
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600\"
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  />
                </div>
              )}

              {/* Address */}
              {hasField('address') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Address
                  </label>
                  <AddressFields
                    streetAddress={formData.street_address}
                    suburb={formData.suburb}
                    state={formData.state}
                    postcode={formData.postcode}
                    onStreetAddressChange={(value) => setFormData(prev => ({ ...prev, street_address: value }))}
                    onSuburbChange={(value) => setFormData(prev => ({ ...prev, suburb: value }))}
                    onStateChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    onPostcodeChange={(value) => setFormData(prev => ({ ...prev, postcode: value }))}
                    required={false}
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">When would you like this work to be done?</p>
                </div>
              )}

              {/* Job Type - Recurring or Once-off */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Job Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center px-4 py-3 border-2 rounded-md cursor-pointer transition-colors"
                    style={{
                      borderColor: formData.is_recurring === 'once-off' ? colors.accent.DEFAULT : colors.border.DEFAULT,
                      backgroundColor: formData.is_recurring === 'once-off' ? `${colors.accent.DEFAULT}10` : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="is_recurring"
                      value="once-off"
                      checked={formData.is_recurring === 'once-off'}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Once-off Job</span>
                  </label>
                  
                  <label className="flex items-center justify-center px-4 py-3 border-2 rounded-md cursor-pointer transition-colors"
                    style={{
                      borderColor: formData.is_recurring === 'recurring' ? colors.accent.DEFAULT : colors.border.DEFAULT,
                      backgroundColor: formData.is_recurring === 'recurring' ? `${colors.accent.DEFAULT}10` : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="is_recurring"
                      value="recurring"
                      checked={formData.is_recurring === 'recurring'}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Recurring Job</span>
                  </label>
                </div>
              </div>

              {/* Recurring Job Details */}
              {formData.is_recurring === 'recurring' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Frequency *
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 appearance-none"
                      >
                        <option value="">Select frequency...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Duration *
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-gray-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 appearance-none"
                      >
                        <option value="">Select duration...</option>
                        <option value="3-months">3 Months</option>
                        <option value="6-months">6 Months</option>
                        <option value="12-months">12 Months</option>
                        <option value="ongoing">Ongoing / Until Cancelled</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-3 rounded-md font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: colors.accent.DEFAULT }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = colors.accent.hover)}
              onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = colors.accent.DEFAULT)}
            >
              {submitting ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
