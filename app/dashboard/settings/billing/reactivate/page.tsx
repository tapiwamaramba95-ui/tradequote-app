'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'

export default function ReactivatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [canReactivate, setCanReactivate] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'business'>('professional')

  useEffect(() => {
    checkReactivationEligibility()
  }, [])

  const checkReactivationEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) return

      setProfile(profileData)

      // Check if within 30-day grace period
      if (profileData.access_until) {
        const accessUntil = new Date(profileData.access_until)
        const now = new Date()
        setCanReactivate(now < accessUntil)
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update subscription status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: selectedPlan,
          subscription_started_at: new Date().toISOString(),
          cancelled_at: null,
          access_until: null,
          deletion_scheduled_at: null,
        })
        .eq('id', user.id)

      if (error) throw error

      // Redirect to payment (TODO: Integrate with Stripe)
      router.push('/dashboard/settings/billing/upgrade')

    } catch (error) {
      console.error('Error reactivating:', error)
      alert('Failed to reactivate account')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  if (!canReactivate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
        <div className="max-w-lg w-full bg-white rounded-2xl p-12 shadow-sm text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Cannot Reactivate
          </h1>
          <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
            Your data was deleted after the 30-day grace period.
            You'll need to create a new account.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold"
          >
            Create New Account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Welcome Back!
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Great to see you again, {profile?.first_name}!
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">Your account is exactly as you left it:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• All your jobs, quotes & invoices</li>
            <li>• All your clients</li>
            <li>• All your settings</li>
          </ul>
        </div>

        <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
          Choose Your Plan
        </h2>

        <div className="space-y-4 mb-8">
          <label
            className="flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedPlan === 'starter' ? colors.accent.DEFAULT : colors.border.DEFAULT }}
          >
            <input
              type="radio"
              name="plan"
              value="starter"
              checked={selectedPlan === 'starter'}
              onChange={(e) => setSelectedPlan(e.target.value as 'starter' | 'professional' | 'business')}
              className="mt-1 w-5 h-5"
              style={{ accentColor: colors.accent.DEFAULT }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                  Starter
                </h3>
                <span className="font-bold text-lg" style={{ color: colors.accent.DEFAULT }}>
                  $20/month
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Solo tradie, unlimited jobs & invoices, client management
              </p>
            </div>
          </label>

          <label
            className="flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedPlan === 'professional' ? colors.accent.DEFAULT : colors.border.DEFAULT }}
          >
            <input
              type="radio"
              name="plan"
              value="professional"
              checked={selectedPlan === 'professional'}
              onChange={(e) => setSelectedPlan(e.target.value as 'starter' | 'professional' | 'business')}
              className="mt-1 w-5 h-5"
              style={{ accentColor: colors.accent.DEFAULT }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                    Professional
                  </h3>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">POPULAR</span>
                </div>
                <span className="font-bold text-lg" style={{ color: colors.accent.DEFAULT }}>
                  $30/month
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Everything + up to 5 staff, timesheets, purchase orders, analytics
              </p>
            </div>
          </label>

          <label
            className="flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedPlan === 'business' ? colors.accent.DEFAULT : colors.border.DEFAULT }}
          >
            <input
              type="radio"
              name="plan"
              value="business"
              checked={selectedPlan === 'business'}
              onChange={(e) => setSelectedPlan(e.target.value as 'starter' | 'professional' | 'business')}
              className="mt-1 w-5 h-5"
              style={{ accentColor: colors.accent.DEFAULT }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                  Business
                </h3>
                <span className="font-bold text-lg" style={{ color: colors.accent.DEFAULT }}>
                  $79/month
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Everything + unlimited staff, custom branding, priority support
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={handleReactivate}
          disabled={loading}
          className="w-full py-4 rounded-lg font-semibold text-white text-lg disabled:opacity-50"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          {loading ? 'Reactivating...' : 'Reactivate My Account'}
        </button>
      </div>
    </div>
  )
}

