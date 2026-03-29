'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsToggle } from '@/components/SettingsToggle'

export default function EnquiriesSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [companyName, setCompanyName] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [enquiryEmail, setEnquiryEmail] = useState('')

  // Generate URL-safe slug from company name
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const formUrl = typeof window !== 'undefined' && companySlug ? `${window.location.origin}/enquiry/${companySlug}` : ''
  const embedCode = `<iframe src="${formUrl}" width="100%" height="800" frameborder="0"></iframe>`

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load company name from business settings
      const { data: businessData } = await supabase
        .from('business_settings')
        .select('company_name')
        .eq('user_id', user.id)
        .single()

      if (businessData) {
        setCompanyName(businessData.company_name || '')
      }

      // Load enquiry settings
      let { data, error } = await supabase
        .from('enquiry_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // If no settings exist, create default ones
      if (error && error.code === 'PGRST116') {
        const companyNameValue = businessData?.company_name || user.email?.split('@')[0] || 'business'
        const baseSlug = companyNameValue.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        
        const enquiryEmailAddress = `${baseSlug}@enquiries.tradequote.com`
        
        const { data: newData } = await supabase
          .from('enquiry_settings')
          .insert({
            user_id: user.id,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Enquiry Settings
        </h1>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Manage how customers can submit enquiries to your business
        </p>
      </div>

      <SettingsCard title="Website Enquiry Form">
        <SettingsToggle
          label="Enable Enquiry Form"
          description="Allow customers to submit enquiries through a web form"
          checked={formEnabled}
          onChange={setFormEnabled}
        />

        {formEnabled && (
          <>
            {!companyName ? (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  ⚠️ Company Name Required
                </p>
                <p className="text-sm text-yellow-800">
                  Please set your company name in <strong>Company Settings</strong> to generate your public enquiry form URL.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>URL based on company name:</strong> {companyName}
                  <br />
                  <span className="text-blue-600 text-xs">
                    To change this URL, update your company name in Company Settings
                  </span>
                </p>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium mb-3 text-base" style={{ color: colors.text.primary }}>
                Direct Link
              </h4>
              <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>
                Share this link on social media or in emails
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formUrl}
                  readOnly
                  className="flex-1 rounded-md border px-2 py-2 text-xs bg-gray-50 break-all"
                  style={{ 
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary 
                  }}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(formUrl)}
                  disabled={!companyName}
                  className="px-3 py-2 rounded-md text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium mb-3 text-base" style={{ color: colors.text.primary }}>
                Embed Code
              </h4>
              <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>
                Copy this code and paste it into your website
              </p>
              <div className="relative">
                <pre className="p-3 rounded-md text-[10px] leading-relaxed bg-gray-50 border break-all whitespace-pre-wrap"
                  style={{ 
                    color: colors.text.primary,
                    borderColor: colors.border.DEFAULT,
                    wordBreak: 'break-all'
                  }}
                >
                  {embedCode}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(embedCode)}
                  disabled={!companyName}
                  className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
      </SettingsCard>

      <SettingsCard title="Email Enquiries">
        <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
          Forward emails to this address to automatically create enquiries
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={enquiryEmail}
            readOnly
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-gray-50"
            style={{ 
              borderColor: colors.border.DEFAULT,
              color: colors.text.primary 
            }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(enquiryEmail)}
            className="px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            Copy
          </button>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm" style={{ color: colors.text.primary }}>
            📧 <strong>Email integration coming soon!</strong>
          </p>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Set up SendGrid to enable email-to-enquiry functionality
          </p>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
