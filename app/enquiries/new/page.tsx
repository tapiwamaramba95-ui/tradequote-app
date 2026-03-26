'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
import { AddressFields } from '@/components/AddressFields'

export default function NewEnquiryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    preferred_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in')
      setLoading(false)
      return
    }

    try {
      // Check if client already exists
      let existingClient = null
      
      // First, try to find by email if provided
      if (formData.customer_email) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .eq('email', formData.customer_email)
          .single()
        
        if (data) {
          existingClient = data
        }
      }
      
      // If no email match and we have name + phone, try that combination
      if (!existingClient && formData.customer_name && formData.customer_phone) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', formData.customer_name)
          .eq('phone', formData.customer_phone)
          .single()
        
        if (data) {
          existingClient = data
        }
      }
      
      // If no existing client found, create a new one
      let isNewClient = false
      if (!existingClient && formData.customer_name) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([
            {
              user_id: user.id,
              name: formData.customer_name,
              email: formData.customer_email || null,
              phone: formData.customer_phone || null,
              street_address: formData.street_address || null,
              suburb: formData.suburb || null,
              state: formData.state || null,
              postcode: formData.postcode || null,
              notes: `Auto-created from enquiry: ${formData.description || 'New enquiry'}`
            }
          ])
          .select()
          .single()

        if (clientError) {
          console.warn('Could not create client:', clientError.message)
          // Continue with enquiry creation even if client creation fails
        } else {
          existingClient = newClient
          isNewClient = true
          console.log('Created new client:', existingClient.name)
        }
      }

      // Create the enquiry
      const { error: enquiryError } = await supabase
        .from('enquiries')
        .insert([
          {
            user_id: user.id,
            source: 'manual',
            status: 'new',
            ...formData
          }
        ])

      if (enquiryError) {
        alert('Error creating enquiry: ' + enquiryError.message)
        setLoading(false)
      } else {
        const clientMessage = existingClient 
          ? `Linked to ${isNewClient ? 'new' : 'existing'} client: ${existingClient.name}`
          : 'Created without client link'
        
        console.log('Enquiry created successfully.', clientMessage)
        router.push('/enquiries')
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      alert('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            New Enquiry
          </h3>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            Add a new customer enquiry to track potential jobs and follow up on quotes.
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
                    htmlFor="customer_name" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    id="customer_name"
                    required
                    autoComplete="name"
                    value={formData.customer_name}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="customer_email" 
                      className="block text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      id="customer_email"
                      autoComplete="email"
                      value={formData.customer_email}
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
                      htmlFor="customer_phone" 
                      className="block text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      id="customer_phone"
                      autoComplete="tel"
                      value={formData.customer_phone}
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
                </div>

                <div>
                  <label 
                    htmlFor="customer_address" 
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.text.primary }}
                  >
                    Job Address
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="job_type" 
                      className="block text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      Job Type
                    </label>
                    <select
                      name="job_type"
                      id="job_type"
                      value={formData.job_type}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.accent.DEFAULT}
                      onBlur={(e) => e.target.style.borderColor = colors.border.DEFAULT}
                    >
                      <option value="">Select job type...</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC</option>
                      <option value="General">General</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label 
                      htmlFor="preferred_date" 
                      className="block text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="preferred_date"
                      id="preferred_date"
                      value={formData.preferred_date}
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
                </div>

                <div>
                  <label 
                    htmlFor="description" 
                    className="block text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the work needed, any specific requirements, or additional details..."
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
                  onClick={() => router.push('/')}
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
                  {loading ? 'Saving...' : 'Save Enquiry'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
