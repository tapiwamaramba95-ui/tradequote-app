'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

type LabourRate = {
  id: string
  rate_name: string
  rate_type: string
  hourly_rate: number
  description: string
  is_active: boolean
  is_default: boolean
}

const RATE_TYPES = [
  { value: 'standard', label: 'Standard Time', description: 'Regular working hours' },
  { value: 'overtime', label: 'Overtime', description: 'After hours or extended shifts' },
  { value: 'weekend', label: 'Weekend', description: 'Saturday and Sunday work' },
  { value: 'emergency', label: 'Emergency', description: 'Urgent call-outs' },
  { value: 'specialist', label: 'Specialist Work', description: 'Requires special skills' },
  { value: 'apprentice', label: 'Apprentice', description: 'Training staff rates' },
]

export default function LabourRatesPage() {
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState<LabourRate[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRate, setEditingRate] = useState<LabourRate | null>(null)
  
  // Form state
  const [rateName, setRateName] = useState('')
  const [rateType, setRateType] = useState('standard')
  const [hourlyRate, setHourlyRate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('labour_rates')
        .select('*')
        .eq('user_id', user.id)
        .order('rate_type')

      if (data) setRates(data)
    } catch (error) {
      console.error('Error loading rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRate = async () => {
    if (!rateName || !hourlyRate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('labour_rates')
        .insert({
          user_id: user.id,
          rate_name: rateName,
          rate_type: rateType,
          hourly_rate: parseFloat(hourlyRate),
          description: description,
          is_active: true,
          is_default: false,
        })

      if (error) throw error

      alert('Labour rate added!')
      resetForm()
      loadRates()
    } catch (error) {
      alert('Failed to add labour rate')
    }
  }

  const handleUpdateRate = async () => {
    if (!editingRate || !rateName || !hourlyRate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('labour_rates')
        .update({
          rate_name: rateName,
          rate_type: rateType,
          hourly_rate: parseFloat(hourlyRate),
          description: description,
        })
        .eq('id', editingRate.id)

      if (error) throw error

      alert('Labour rate updated!')
      resetForm()
      loadRates()
    } catch (error) {
      alert('Failed to update labour rate')
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labour rate?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('labour_rates')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Labour rate deleted')
      loadRates()
    } catch (error) {
      alert('Failed to delete labour rate')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('labour_rates')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error

      loadRates()
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove default from all rates
      await supabase
        .from('labour_rates')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Set this one as default
      const { error } = await supabase
        .from('labour_rates')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      loadRates()
    } catch (error) {
      alert('Failed to set default rate')
    }
  }

  const startEdit = (rate: LabourRate) => {
    setEditingRate(rate)
    setRateName(rate.rate_name)
    setRateType(rate.rate_type)
    setHourlyRate(rate.hourly_rate.toString())
    setDescription(rate.description || '')
    setShowAddForm(true)
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingRate(null)
    setRateName('')
    setRateType('standard')
    setHourlyRate('')
    setDescription('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
            Labour Rates
          </h1>
          <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
            Set predetermined hourly rates for different types of work
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            + Add Rate
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            {editingRate ? 'Edit Labour Rate' : 'Add Labour Rate'}
          </h2>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Rate Name
                </label>
                <input
                  type="text"
                  value={rateName}
                  onChange={(e) => setRateName(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg"
                  style={{ borderColor: colors.border.DEFAULT }}
                  placeholder="e.g., Standard Time"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Rate Type
                </label>
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  {RATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="85.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 rounded-lg resize-none"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="When this rate applies..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              Cancel
            </button>
            <button
              onClick={editingRate ? handleUpdateRate : handleAddRate}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              {editingRate ? 'Update Rate' : 'Add Rate'}
            </button>
          </div>
        </div>
      )}

      {/* Rates List */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {rates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
              No labour rates yet
            </h3>
            <p className="mb-6" style={{ color: colors.text.secondary }}>
              Add your first labour rate to get started
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              + Add Rate
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border.DEFAULT }}>
            {rates.map((rate) => (
              <div key={rate.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                        {rate.rate_name}
                      </h3>
                      {rate.is_default && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                          Default
                        </span>
                      )}
                      {!rate.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-2xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                        ${rate.hourly_rate.toFixed(2)}
                      </span>
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        per hour
                      </span>
                      <span className="text-sm px-3 py-1 bg-gray-100 rounded-full" style={{ color: colors.text.secondary }}>
                        {RATE_TYPES.find(t => t.value === rate.rate_type)?.label}
                      </span>
                    </div>
                    {rate.description && (
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        {rate.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(rate)}
                      className="px-4 py-2 border-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                      style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                    >
                      Edit
                    </button>
                    {!rate.is_default && (
                      <button
                        onClick={() => handleSetDefault(rate.id)}
                        className="px-4 py-2 border-2 rounded-lg text-sm font-semibold hover:bg-orange-50 transition-colors"
                        style={{ borderColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(rate.id, rate.is_active)}
                      className="px-4 py-2 border-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                      style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                    >
                      {rate.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteRate(rate.id)}
                      className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
        <h3 className="font-semibold mb-3" style={{ color: colors.text.primary }}>💡 How Labour Rates Work</h3>
        <ul className="space-y-2 text-sm" style={{ color: colors.text.secondary }}>
          <li>• Set different rates for standard time, overtime, weekends, and emergencies</li>
          <li>• Default rate is automatically applied when creating quotes or invoices</li>
          <li>• You can override rates on individual quotes/invoices</li>
          <li>• Inactive rates are hidden but can be reactivated anytime</li>
          <li>• Rates can be customized per staff member (Pro feature)</li>
        </ul>
      </div>
    </div>
  )
}
