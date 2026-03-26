'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

type Profile = {
  subscription_status: string
  subscription_plan: string
  billing_period: string
  trial_ends_at: string
}

export default function BillingSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)

        if (profileData.trial_ends_at) {
          const trialEnd = new Date(profileData.trial_ends_at)
          const now = new Date()
          const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setDaysRemaining(Math.max(days, 0))
        }
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
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

  const isOnTrial = profile?.subscription_status === 'trial'
  const isActive = profile?.subscription_status === 'active'
  const isStarter = profile?.subscription_plan === 'starter'
  const isProfessional = profile?.subscription_plan === 'professional'
  const isBusiness = profile?.subscription_plan === 'business'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: colors.text.primary }}>
        Billing & Plans
      </h1>

      {isOnTrial && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-900 mb-1">
                ⏰ {daysRemaining} days left in your trial
              </h3>
              <p className="text-sm text-orange-700">
                Choose a plan to continue using TradeQuote after your trial ends
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/settings/billing/upgrade')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Choose Plan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
          Current Plan
        </h2>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {isOnTrial ? 'Free Trial' : isStarter ? 'Starter' : isProfessional ? 'Professional' : 'Business'}
              </h3>
              {isActive && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  Active
                </span>
              )}
            </div>
            {isActive && (
              <p className="text-lg font-bold" style={{ color: colors.accent.DEFAULT }}>
                {isStarter ? '$39' : isProfessional ? '$49' : '$89'}/month
              </p>
            )}
            {isOnTrial && profile && (
              <p style={{ color: colors.text.secondary }}>
                Ends {new Date(profile.trial_ends_at).toLocaleDateString('en-AU')}
              </p>
            )}
          </div>

          {isActive && (
            <div className="flex gap-3">
              {isStarter && (
                <button
                  onClick={() => router.push('/dashboard/settings/billing/upgrade?plan=professional')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                >
                  Upgrade
                </button>
              )}
              {isProfessional && (
                <button
                  onClick={() => router.push('/dashboard/settings/billing/upgrade?plan=business')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>

        {isActive && (
          <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
            <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
              Your plan includes:
            </h4>
            <ul className="grid grid-cols-2 gap-3 text-sm" style={{ color: colors.text.secondary }}>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Unlimited jobs & invoices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {isStarter ? '1 user' : isProfessional ? 'Up to 5 staff' : 'Unlimited staff'}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Mobile app
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {isStarter ? 'Email support' : 'Priority support'}
              </li>
              {(isProfessional || isBusiness) && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Timesheets
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Purchase orders
                  </li>
                </>
              )}
              {isBusiness && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Custom branding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    API access
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {isActive && (
          <div className="border-t mt-6 pt-6" style={{ borderColor: colors.border.DEFAULT }}>
            <button
              onClick={() => router.push('/dashboard/settings/billing/cancel')}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {!isActive && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Choose Your Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 rounded-xl p-6" style={{ borderColor: colors.border.DEFAULT }}>
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                Perfect for solo tradies
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $39
                </span>
                <span className="text-sm">/month</span>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings/billing/upgrade?plan=starter')}
                className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50"
                style={{ borderColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
              >
                Choose Starter
              </button>
            </div>

            <div className="border-2 rounded-xl p-6 relative" style={{ borderColor: colors.accent.DEFAULT }}>
              <div className="absolute -top-3 right-4 px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                For small teams
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $49
                </span>
                <span className="text-sm">/month</span>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings/billing/upgrade?plan=professional')}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
              >
                Choose Professional
              </button>
            </div>

            <div className="border-2 rounded-xl p-6" style={{ borderColor: colors.border.DEFAULT }}>
              <h3 className="text-xl font-bold mb-2">Business</h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                For growing businesses
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $89
                </span>
                <span className="text-sm">/month</span>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings/billing/upgrade?plan=business')}
                className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50"
                style={{ borderColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
              >
                Choose Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
