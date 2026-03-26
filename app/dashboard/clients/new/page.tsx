'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
import { AddressFields } from '@/components/AddressFields'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'

// GOOGLE PLACES: Set this to true when you've added your API key
const USE_GOOGLE_PLACES = false

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({})
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street_address: '',
    suburb: '',
    state: '',
    postcode: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in')
      return
    }

    const { error } = await supabase
      .from('clients')
      .insert([
        {
          user_id: user.id,
          ...formData
        }
      ])

    if (error) {
      alert('Error creating client: ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/clients')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6" style={{ color: colors.text.primary }}>
            New Client
          </h3>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            Add a new client to your database.
          </p>
        </div>
        
        <div className="mt-5 md:col-span-2 md:mt-0">
          <form onSubmit={handleSubmit}>
            <div 
              className="shadow sm:overflow-hidden sm:rounded-md"
              style={{ backgroundColor: colors.background.card }}
            >
              <div className="space-y-6 px-4 py-5 sm:p-6">
                <div>
                  <label 
                    htmlFor="name" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2 border transition-colors"
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
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={(e) => {
                      const normalized = normalizeEmail(e.target.value)
                      setFormData(prev => ({ ...prev, email: normalized }))
                      
                      // Check for typos
                      const suggestion = suggestEmailCorrection(normalized)
                      setEmailSuggestion(suggestion)
                      
                      // Validate
                      if (normalized && !isValidEmail(normalized)) {
                        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
                      } else {
                        setErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2 border transition-colors ${errors.email ? 'border-red-500' : ''}`}
                    style={{
                      borderColor: errors.email ? '#ef4444' : colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  {emailSuggestion && !errors.email && (
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, email: emailSuggestion }))
                        setEmailSuggestion(null)
                      }}
                      className="text-sm text-cyan-600 hover:text-cyan-700 mt-1"
                    >
                      Did you mean {emailSuggestion}?
                    </button>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor="phone" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={(e) => {
                      const formatted = formatAustralianPhone(e.target.value)
                      setFormData(prev => ({ ...prev, phone: formatted }))
                      
                      if (formatted && !isValidAustralianPhone(formatted)) {
                        setErrors(prev => ({ ...prev, phone: 'Please enter a valid Australian phone number' }))
                      } else {
                        setErrors(prev => ({ ...prev, phone: undefined }))
                      }
                    }}
                    placeholder="0412 345 678"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2 border transition-colors ${errors.phone ? 'border-red-500' : ''}`}
                    style={{
                      borderColor: errors.phone ? '#ef4444' : colors.border.DEFAULT,
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                  />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label 
                    htmlFor="address" 
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.text.primary }}
                  >
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

                <div>
                  <label 
                    htmlFor="notes" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional information about this client..."
                    className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2 border transition-colors"
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
              
              <div 
                className="px-4 py-3 text-right sm:px-6 space-x-3"
                style={{ backgroundColor: colors.background.main }}
              >
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/clients')}
                  className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
                >
                  {loading ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}