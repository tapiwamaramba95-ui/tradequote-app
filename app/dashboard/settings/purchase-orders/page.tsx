'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsInput } from '@/components/SettingsInput'

export default function PurchaseOrderSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [poPrefix, setPoPrefix] = useState('PO')
  const [poStartNumber, setPoStartNumber] = useState('1')
  const [defaultMarkup, setDefaultMarkup] = useState('20.00')

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
        setPoPrefix(data.po_prefix || 'PO')
        setPoStartNumber(String(data.po_start_number || 1))
        setDefaultMarkup(String(data.default_markup_percentage || 20.00))
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
        .from('business_settings')
        .update({
          po_prefix: poPrefix,
          po_start_number: parseInt(poStartNumber) || 1,
          default_markup_percentage: parseFloat(defaultMarkup) || 20.00,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (!error) {
        alert('Purchase order settings saved!')
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
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
        Purchase Order Settings
      </h1>

      <SettingsCard title="PO Numbering">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput 
            label="PO Prefix" 
            value={poPrefix} 
            onChange={setPoPrefix} 
            helpText="E.g. 'PO' creates PO001, PO002" 
          />
          <SettingsInput 
            label="Next PO Number" 
            type="number" 
            value={poStartNumber} 
            onChange={setPoStartNumber} 
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Pricing">
        <SettingsInput 
          label="Default Markup Percentage" 
          type="number" 
          value={defaultMarkup} 
          onChange={setDefaultMarkup}
          helpText="Default markup to apply to supplier costs"
        />
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
