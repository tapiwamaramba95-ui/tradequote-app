'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsInput } from '@/components/SettingsInput'

type PricingData = {
  defaultTaxRate: number
  defaultMarkupPercentage: number
}

export default function PricingLevelsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<PricingData>({
    defaultTaxRate: 10.0,
    defaultMarkupPercentage: 20.0,
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
        .select('default_tax_rate, default_markup_percentage')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setFormData({
          defaultTaxRate: data.default_tax_rate || 10.0,
          defaultMarkupPercentage: data.default_markup_percentage || 20.0,
        })
      }
    } catch (error) {
      console.error('Error loading pricing settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = useCallback((field: keyof PricingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleTaxRateChange = useCallback((val: number) => updateField('defaultTaxRate', val), [updateField])
  const handleMarkupChange = useCallback((val: number) => updateField('defaultMarkupPercentage', val), [updateField])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to save settings')
        return
      }

      const updateData = {
        default_tax_rate: formData.defaultTaxRate,
        default_markup_percentage: formData.defaultMarkupPercentage,
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
        alert('Pricing settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving pricing settings:', error)
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
        Pricing
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Default pricing settings that will be applied to new quotes, invoices, and purchase orders.
      </p>

      <SettingsCard title="">
        {/* Default Tax Rate */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Default Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.defaultTaxRate}
            onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
            placeholder="10.00"
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              backgroundColor: colors.background.card,
              color: colors.text.primary,
              border: `1px solid ${colors.border.DEFAULT}`,
            }}
          />
          <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
            This rate will be used as the default for new quotes and invoices (GST, VAT, Sales Tax, etc.).
          </p>
        </div>

        {/* Default Markup Percentage */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Default Markup Percentage
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1000"
            value={formData.defaultMarkupPercentage}
            onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
            placeholder="20.00"
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              backgroundColor: colors.background.card,
              color: colors.text.primary,
              border: `1px solid ${colors.border.DEFAULT}`,
            }}
          />
          <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
            Default markup to apply to supplier costs when creating purchase orders and calculating profit margins.
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
