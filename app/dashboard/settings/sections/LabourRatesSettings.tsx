'use client'

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { Plus, Edit, Trash2 } from 'lucide-react'

type LabourRate = {
  id: string
  rate_name: string
  rate_type: string
  hourly_rate: number
  is_active: boolean
  is_default: boolean
  created_at: string
}

const RATE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'apprentice', label: 'Apprentice' },
]

export default function LabourRatesSettings() {
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState<LabourRate[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingRate, setEditingRate] = useState<LabourRate | null>(null)
  const [formData, setFormData] = useState({
    rate_name: '',
    rate_type: 'standard',
    hourly_rate: 0,
  })

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('labour_rates')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('rate_type', { ascending: true })
        .order('rate_name', { ascending: true })

      if (!error && data) {
        setRates(data)
      }
    } catch (error) {
      console.error('Error loading labour rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      if (editingRate) {
        const { error } = await supabase
          .from('labour_rates')
          .update({
            rate_name: formData.rate_name,
            rate_type: formData.rate_type,
            hourly_rate: formData.hourly_rate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRate.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('labour_rates')
          .insert({
            user_id: user.id,
            rate_name: formData.rate_name,
            rate_type: formData.rate_type,
            hourly_rate: formData.hourly_rate,
            is_active: true,
            is_default: false,
          })

        if (error) throw error
      }

      loadRates()
      closeModal()
    } catch (error) {
      console.error('Error saving labour rate:', error)
      alert('Failed to save labour rate')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labour rate?')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('labour_rates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      loadRates()
    }
  }

  const handleToggleActive = async (rate: LabourRate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('labour_rates')
      .update({ is_active: !rate.is_active })
      .eq('id', rate.id)
      .eq('user_id', user.id)

    if (!error) {
      loadRates()
    }
  }

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Remove default from all rates
    await supabase
      .from('labour_rates')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set new default
    const { error } = await supabase
      .from('labour_rates')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      loadRates()
    }
  }

  const openModal = (rate?: LabourRate) => {
    if (rate) {
      setEditingRate(rate)
      setFormData({
        rate_name: rate.rate_name,
        rate_type: rate.rate_type,
        hourly_rate: rate.hourly_rate,
      })
    } else {
      setEditingRate(null)
      setFormData({ rate_name: '', rate_type: 'standard', hourly_rate: 0 })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRate(null)
    setFormData({ rate_name: '', rate_type: 'standard', hourly_rate: 0 })
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
            Labour Rates
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Manage hourly labour rates for different types of work and staff
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: colors.accent.DEFAULT,
            color: colors.text.inverse
          }}
        >
          <Plus size={18} />
          Add Rate
        </button>
      </div>

      {rates.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          <p style={{ color: colors.text.secondary }}>
            No labour rates configured yet. Add your first rate to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="rounded-lg border p-4"
              style={{
                backgroundColor: colors.background.card,
                borderColor: rate.is_default ? colors.accent.DEFAULT : colors.border.DEFAULT,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                      {rate.rate_name}
                    </h3>
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${colors.accent.DEFAULT}20`,
                        color: colors.accent.DEFAULT,
                      }}
                    >
                      {RATE_TYPES.find(rt => rt.value === rate.rate_type)?.label || rate.rate_type}
                    </span>
                    {rate.is_default && (
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                        }}
                      >
                        Default
                      </span>
                    )}
                    {!rate.is_active && (
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold" style={{ color: colors.accent.DEFAULT }}>
                    ${rate.hourly_rate.toFixed(2)} / hour
                  </p>
                </div>
                <div className="flex gap-2">
                  {!rate.is_default && (
                    <button
                      onClick={() => handleSetDefault(rate.id)}
                      className="px-3 py-1 text-sm rounded"
                      style={{
                        backgroundColor: `${colors.accent.DEFAULT}20`,
                        color: colors.accent.DEFAULT,
                      }}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleActive(rate)}
                    className="px-3 py-1 text-sm rounded"
                    style={{
                      backgroundColor: rate.is_active ? '#fee2e2' : '#dcfce7',
                      color: rate.is_active ? '#dc2626' : '#16a34a',
                    }}
                  >
                    {rate.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openModal(rate)}
                    className="p-2 rounded"
                    style={{
                      backgroundColor: `${colors.accent.DEFAULT}20`,
                      color: colors.accent.DEFAULT,
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(rate.id)}
                    className="p-2 rounded"
                    style={{
                      backgroundColor: `${colors.semantic.error}20`,
                      color: colors.semantic.error,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl max-w-md w-full p-6"
            style={{ backgroundColor: colors.background.card }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
              {editingRate ? 'Edit Labour Rate' : 'New Labour Rate'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Rate Name *
                </label>
                <input
                  type="text"
                  value={formData.rate_name}
                  onChange={(e) => setFormData({ ...formData, rate_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="e.g., Standard Hourly Rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Rate Type *
                </label>
                <select
                  value={formData.rate_type}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                >
                  {RATE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Hourly Rate ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: colors.text.inverse
                  }}
                >
                  {editingRate ? 'Update Rate' : 'Create Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
