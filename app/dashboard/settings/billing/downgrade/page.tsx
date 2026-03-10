'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

export default function DowngradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional'>('professional')
  const [reason, setReason] = useState('')

  const handleDowngrade = async () => {
    if (!confirm(`Are you sure you want to downgrade to ${selectedPlan === 'starter' ? 'Starter' : 'Professional'}?`)) {
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // In production: Update Stripe subscription
      // For now: Update database directly
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan: selectedPlan })
        .eq('id', user.id)

      if (error) throw error

      alert(`Successfully downgraded to ${selectedPlan === 'starter' ? 'Starter' : 'Professional'} plan`)
      router.push('/dashboard/settings/billing')
    } catch (error) {
      alert('Failed to downgrade plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-sm font-semibold"
        style={{ color: colors.accent.DEFAULT }}
      >
        ← Back to Billing
      </button>

      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
        Downgrade Plan
      </h1>
      <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
        Choose a lower tier plan
      </p>

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
        <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
          Select New Plan
        </h3>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedPlan('professional')}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              selectedPlan === 'professional' ? 'border-2 bg-blue-50' : 'border-2'
            }`}
            style={{
              borderColor: selectedPlan === 'professional' ? colors.accent.DEFAULT : colors.border.DEFAULT,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  Professional
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  $30/month • Up to 5 staff
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlan('starter')}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              selectedPlan === 'starter' ? 'border-2 bg-blue-50' : 'border-2'
            }`}
            style={{
              borderColor: selectedPlan === 'starter' ? colors.accent.DEFAULT : colors.border.DEFAULT,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  Starter
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  $20/month • 1 user only
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
            Why are you downgrading? (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 rounded-lg resize-none"
            style={{ borderColor: colors.border.DEFAULT }}
            placeholder="Help us improve by sharing your feedback..."
          />
        </div>

        <button
          onClick={handleDowngrade}
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm Downgrade'}
        </button>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Your downgrade will take effect at the end of your current billing period</li>
          <li>• You'll retain access to your current features until then</li>
          <li>• Some features may become unavailable after downgrade</li>
        </ul>
      </div>
    </div>
  )
}
