'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsInput } from '@/components/SettingsInput'
import { LogoUpload } from '@/components/LogoUpload'
import AddressInput from '@/components/AddressInput'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'

type FormData = {
  companyName: string
  gstRegistered: boolean
  abn: string
  licenceNumber: string
  currency: string
  timezone: string
  deliveryAddress: string
  email: string
  phone: string
  logoUrl: string
  brandColor: string
}

type ValidationErrors = {
  phone?: string
  email?: string
}

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    gstRegistered: false,
    abn: '',
    licenceNumber: '',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    deliveryAddress: '',
    email: '',
    phone: '',
    logoUrl: '',
    brandColor: '#0EA5A4',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setFormData({
          companyName: data.company_name || '',
          gstRegistered: data.gst_registered || false,
          abn: data.abn || '',
          licenceNumber: data.company_licence_number || '',
          currency: data.currency || 'AUD',
          timezone: data.timezone || 'Australia/Sydney',
          deliveryAddress: data.company_address || '',
          email: data.company_email || '',
          phone: data.company_phone || '',
          logoUrl: data.company_logo_url || '',
          brandColor: data.primary_brand_color || '#0EA5A4',
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Memoized handlers for each field to prevent unnecessary re-renders
  const handleCompanyNameChange = useCallback((val: string) => updateField('companyName', val), [updateField])
  const handleAbnChange = useCallback((val: string) => updateField('abn', val), [updateField])
  const handleLicenceChange = useCallback((val: string) => updateField('licenceNumber', val), [updateField])
  const handleCurrencyChange = useCallback((val: string) => updateField('currency', val), [updateField])
  const handleTimezoneChange = useCallback((val: string) => updateField('timezone', val), [updateField])
  const handleAddressChange = useCallback((val: string) => updateField('deliveryAddress', val), [updateField])
  const handleEmailChange = useCallback((val: string) => updateField('email', val), [updateField])
  const handlePhoneChange = useCallback((val: string) => updateField('phone', val), [updateField])
  const handleLogoChange = useCallback((val: string) => updateField('logoUrl', val), [updateField])
  const handleBrandColorChange = useCallback((val: string) => updateField('brandColor', val), [updateField])
  const handleGstRegisteredChange = useCallback((val: boolean) => updateField('gstRegistered', val), [updateField])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to save settings')
        return
      }

      const updateData = {
        company_name: formData.companyName,
        gst_registered: formData.gstRegistered,
        abn: formData.abn,
        company_licence_number: formData.licenceNumber,
        currency: formData.currency,
        timezone: formData.timezone,
        company_address: formData.deliveryAddress,
        company_email: formData.email,
        company_phone: formData.phone,
        company_logo_url: formData.logoUrl,
        primary_brand_color: formData.brandColor,
        updated_at: new Date().toISOString(),
      }

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          ...updateData
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Save error:', error)
        alert(`Failed to save: ${error.message}`)
      } else {
        // ✅ Check if company profile is now complete
        if (formData.abn && formData.deliveryAddress) {
          await supabase
            .from('onboarding_progress')
            .update({ 
              company_profile_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
        }
        
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
        Company
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Company details that will be used for customer-facing documents and the currency and timezone settings for your Tradify account.
      </p>

      <SettingsCard title="">
        {/* Company Name - Full Width */}
        <div className="mb-4">
          <SettingsInput
            label="Company Name"
            value={formData.companyName}
            onChange={handleCompanyNameChange}
            placeholder="APM Maintaince"
          />
        </div>

        {/* GST Registered and ABN - Two Columns */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              GST Registered
            </label>
            <select
              value={formData.gstRegistered ? 'yes' : 'no'}
              onChange={(e) => handleGstRegisteredChange(e.target.value === 'yes')}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div>
            <SettingsInput
              label="ABN"
              value={formData.abn}
              onChange={handleAbnChange}
              placeholder=""
            />
          </div>
        </div>

        {/* Company Licence Number - Full Width */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Company Licence Number
            <svg className="w-4 h-4" style={{ color: colors.text.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </label>
          <input
            type="text"
            value={formData.licenceNumber}
            onChange={(e) => handleLicenceChange(e.target.value)}
            placeholder=""
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              backgroundColor: colors.background.card,
              color: colors.text.primary,
              border: `1px solid ${colors.border.DEFAULT}`,
            }}
          />
        </div>

        {/* Currency and Timezone - Two Columns */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            >
              <option value="AUD">Australian Dollar</option>
              <option value="USD">US Dollar</option>
              <option value="NZD">New Zealand Dollar</option>
              <option value="GBP">British Pound</option>
              <option value="EUR">Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              System Time Zone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            >
              <option value="Australia/Sydney">(UTC+10:00) Canberra, Melbourne, Sydney</option>
              <option value="Australia/Brisbane">(UTC+10:00) Brisbane</option>
              <option value="Australia/Adelaide">(UTC+09:30) Adelaide</option>
              <option value="Australia/Perth">(UTC+08:00) Perth</option>
              <option value="Pacific/Auckland">(UTC+12:00) Auckland, Wellington</option>
              <option value="America/New_York">(UTC-05:00) Eastern Time (US & Canada)</option>
              <option value="America/Los_Angeles">(UTC-08:00) Pacific Time (US & Canada)</option>
              <option value="Europe/London">(UTC+00:00) London</option>
            </select>
          </div>
        </div>

        {/* Delivery Address - Full Width */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Delivery Address
          </label>
          <AddressInput
            value={formData.deliveryAddress}
            onChange={handleAddressChange}
            required={false}
          />
        </div>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard title="Contact Information">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeEmail(e.target.value)
                handleEmailChange(normalized)
                
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
              placeholder="info@acmeplumbing.com"
              className={`w-full px-3 py-2 rounded-md text-sm ${errors.email ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: errors.email ? '1px solid #ef4444' : `1px solid ${colors.border.DEFAULT}`,
              }}
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            {emailSuggestion && !errors.email && (
              <button 
                onClick={() => {
                  handleEmailChange(emailSuggestion)
                  setEmailSuggestion(null)
                }}
                className="text-sm text-orange-500 hover:text-orange-600 mt-1"
              >
                Did you mean {emailSuggestion}?
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={(e) => {
                const formatted = formatAustralianPhone(e.target.value)
                handlePhoneChange(formatted)
                
                if (formatted && !isValidAustralianPhone(formatted)) {
                  setErrors(prev => ({ ...prev, phone: 'Please enter a valid Australian phone number' }))
                } else {
                  setErrors(prev => ({ ...prev, phone: undefined }))
                }
              }}
              placeholder="0412 345 678"
              className={`w-full px-3 py-2 rounded-md text-sm ${errors.phone ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: errors.phone ? '1px solid #ef4444' : `1px solid ${colors.border.DEFAULT}`,
              }}
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>
        </div>
      </SettingsCard>

      {/* Branding */}
      <SettingsCard title="Branding">
        <LogoUpload
          currentLogoUrl={formData.logoUrl}
          onLogoUpload={handleLogoChange}
          onLogoRemove={() => handleLogoChange('')}
        />
        
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Primary Brand Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.brandColor}
              onChange={(e) => handleBrandColorChange(e.target.value)}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.brandColor}
              onChange={(e) => handleBrandColorChange(e.target.value)}
              placeholder="#0EA5A4"
              className="flex-1 px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
            This color will be used in emails and customer-facing documents.
          </p>
        </div>
      </SettingsCard>

      <div className="flex justify-end mt-6">
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
