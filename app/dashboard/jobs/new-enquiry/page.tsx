'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getNextEnquiryNumber } from '@/lib/utils/enquiry'

const ENQUIRY_SOURCES = [
  'Phone Call',
  'Email',
  'Website Form',
  'Referral',
  'Walk-in',
  'Social Media',
  'Other',
]

interface Client {
  id: string
  name: string
  email: string
  phone: string
}

export default function NewEnquiryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nextEnquiryNumber, setNextEnquiryNumber] = useState('')
  
  // Form state
  const [clientId, setClientId] = useState('')
  const [jobName, setJobName] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [description, setDescription] = useState('')
  const [enquirySource, setEnquirySource] = useState('Phone Call')
  
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    loadClients()
    loadNextEnquiryNumber()
  }, [])

  const loadNextEnquiryNumber = async () => {
    const number = await getNextEnquiryNumber()
    setNextEnquiryNumber(number)
  }

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (data) setClients(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        return
      }

      // Create job with enquiry status
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          client_id: clientId,
          job_name: jobName,
          job_address: jobAddress,
          description: description,
          enquiry_source: enquirySource.toLowerCase().replace(/\s+/g, '_'),
          enquiry_date: new Date().toISOString(),
          status: 'enquiry',
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to job detail
      router.push(`/dashboard/jobs/${job.id}`)

    } catch (error) {
      console.error('Error creating job:', error)
      alert('Failed to create job from enquiry')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: colors.text.primary }}>
        New Enquiry
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Enquiry Number Preview */}
        {nextEnquiryNumber && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              <p className="text-sm text-purple-900">
                This enquiry will be assigned: <span className="font-bold px-2 py-0.5 bg-purple-100 rounded text-purple-700">{nextEnquiryNumber}</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Enquiry Details
          </h2>

          <div className="space-y-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <option value="">Select client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/clients/new')}
                  className="text-sm font-semibold"
                  style={{ color: colors.accent.DEFAULT }}
                >
                  + Add New Client
                </button>
              </div>
            </div>

            {/* Job Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Job Name
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="e.g., Kitchen Renovation"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Job Address
              </label>
              <input
                type="text"
                value={jobAddress}
                onChange={(e) => setJobAddress(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="123 Main St, Melbourne VIC 3000"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg resize-none"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="What does the client need?"
              />
            </div>

            {/* Enquiry Source */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                How did they contact you?
              </label>
              <select
                value={enquirySource}
                onChange={(e) => setEnquirySource(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                {ENQUIRY_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border-2 rounded-lg font-semibold"
            style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
