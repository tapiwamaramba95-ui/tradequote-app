'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsToggle } from '@/components/SettingsToggle'

export default function EnquirySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [publicProfileName, setPublicProfileName] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [enquiryEmail, setEnquiryEmail] = useState('')

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/enquiry/${publicProfileName}` : ''
  const embedCode = `<iframe src="${formUrl}" width="100%" height="800" frameborder="0"></iframe>`

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data, error } = await supabase
        .from('enquiry_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // If no settings exist, create default ones
      if (error && error.code === 'PGRST116') {
        // Get company name from business settings to use for profile name
        const { data: businessData } = await supabase
          .from('business_settings')
          .select('company_name')
          .eq('user_id', user.id)
          .single()

        // Generate URL-safe profile name from company name or fallback to email
        const companyName = businessData?.company_name || user.email?.split('@')[0] || 'business'
        const baseProfileName = companyName.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        
        const enquiryEmailAddress = `${baseProfileName}@enquiries.tradequote.com`
        
        const { data: newData, error: insertError } = await supabase
          .from('enquiry_settings')
          .insert({
            user_id: user.id,
            public_profile_name: baseProfileName,
            enquiry_email: enquiryEmailAddress,
            form_enabled: true
          })
          .select()
          .single()

        if (newData) {
          data = newData
        }
      }

      if (data) {
        setPublicProfileName(data.public_profile_name || '')
        setFormEnabled(data.form_enabled ?? true)
        setEnquiryEmail(data.enquiry_email || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('enquiry_settings')
        .update({
          form_enabled: formEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (!error) {
        alert('Settings saved!')
      } else {
        alert('Failed to save')
      }
    } catch (error) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Enquiry Settings
      </h1>

      <SettingsCard title="Website Enquiry Form">
        <SettingsToggle
          label="Enable Enquiry Form"
          description="Allow customers to submit enquiries through a web form"
          checked={formEnabled}
          onChange={setFormEnabled}
        />

        {formEnabled && (
          <>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium mb-3 text-gray-900">
                Direct Link
              </h4>
              <p className="text-sm mb-2 text-gray-600">
                Share this link on social media or in emails
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formUrl}
                  readOnly
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-900"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(formUrl)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium mb-3 text-gray-900">
                Embed Code
              </h4>
              <p className="text-sm mb-2 text-gray-600">
                Copy this code and paste it into your website
              </p>
              <div className="relative">
                <pre className="p-4 rounded-md text-xs overflow-x-auto bg-gray-50 text-gray-900 border border-gray-200">
                  {embedCode}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(embedCode)}
                  className="absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
      </SettingsCard>

      <SettingsCard title="Email Enquiries">
        <p className="text-sm mb-4 text-gray-600">
          Forward emails to this address to automatically create enquiries
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={enquiryEmail}
            readOnly
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-900"
          />
          <button
            onClick={() => navigator.clipboard.writeText(enquiryEmail)}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
          >
            Copy
          </button>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-gray-900">
            📧 <strong>Email integration coming soon!</strong>
          </p>
          <p className="text-sm mt-1 text-gray-600">
            Set up SendGrid to enable email-to-enquiry functionality
          </p>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
