'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsInput } from '@/components/SettingsInput'

export default function JobsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [jobPrefix, setJobPrefix] = useState('J')
  const [jobStartNumber, setJobStartNumber] = useState('1')
  const [quotePrefix, setQuotePrefix] = useState('Q')
  const [quoteStartNumber, setQuoteStartNumber] = useState('1')

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
        setJobPrefix(data.job_prefix || 'J')
        setJobStartNumber(String(data.job_start_number || 1))
        setQuotePrefix(data.quote_prefix || 'Q')
        setQuoteStartNumber(String(data.quote_start_number || 1))
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
          job_prefix: jobPrefix,
          job_start_number: parseInt(jobStartNumber) || 1,
          quote_prefix: quotePrefix,
          quote_start_number: parseInt(quoteStartNumber) || 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (!error) {
        alert('Job settings saved!')
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
        Jobs Settings
      </h1>

      <SettingsCard title="Job Numbering">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput label="Job Prefix" value={jobPrefix} onChange={setJobPrefix} helpText="E.g. 'J' creates J001, J002" />
          <SettingsInput label="Next Job Number" type="number" value={jobStartNumber} onChange={setJobStartNumber} />
        </div>
      </SettingsCard>

      <SettingsCard title="Quote Numbering">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput label="Quote Prefix" value={quotePrefix} onChange={setQuotePrefix} helpText="E.g. 'Q' creates Q001, Q002" />
          <SettingsInput label="Next Quote Number" type="number" value={quoteStartNumber} onChange={setQuoteStartNumber} />
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
