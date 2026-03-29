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
  const currentPlan = profile?.subscription_plan || 'none'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 39,
      description: 'Perfect for solo tradies',
      features: [
        'Unlimited jobs & invoices',
        '1 user',
        'Mobile app',
        'Email support',
        'Quote & invoice templates',
        'Basic reporting'
      ],
      isCurrent: currentPlan === 'starter'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      description: 'For small teams',
      features: [
        'Everything in Starter',
        'Up to 5 staff members',
        'Timesheets',
        'Purchase orders',
        'Priority support',
        'Advanced reporting'
      ],
      isCurrent: currentPlan === 'professional',
      isPopular: true
    },
    {
      id: 'business',
      name: 'Business',
      price: 89,
      description: 'For growing businesses',
      features: [
        'Everything in Professional',
        'Unlimited staff',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      isCurrent: currentPlan === 'business'
    }
  ]

  const canUpgradeTo = (planId: string) => {
    const planOrder = ['none', 'starter', 'professional', 'business']
    const currentIndex = planOrder.indexOf(currentPlan)
    const targetIndex = planOrder.indexOf(planId)
    return targetIndex > currentIndex
  }

  const canDowngradeTo = (planId: string) => {
    const planOrder = ['none', 'starter', 'professional', 'business']
    const currentIndex = planOrder.indexOf(currentPlan)
    const targetIndex = planOrder.indexOf(planId)
    return isActive && targetIndex < currentIndex && targetIndex > 0
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
        Billing & Plans
      </h1>
      <p className="text-sm mb-8" style={{ color: colors.text.secondary }}>
        Choose the plan that works best for your business
      </p>

      {isOnTrial && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-900 mb-1">
                ⏰ {daysRemaining} days left in your trial
              </h3>
              <p className="text-sm text-orange-700">
                Choose a plan to continue using TradeQuote after your trial ends
              </p>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold">✓</span>
            <p className="text-sm text-green-800">
              You're currently on the <strong>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong> plan
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border-2 rounded-xl p-6 relative ${
              plan.isCurrent ? 'border-green-500 bg-green-50' : ''
            }`}
            style={!plan.isCurrent ? { borderColor: plan.isPopular ? colors.accent.DEFAULT : colors.border.DEFAULT } : {}}
          >
            {plan.isPopular && !plan.isCurrent && (
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                POPULAR
              </div>
            )}
            {plan.isCurrent && (
              <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                CURRENT PLAN
              </div>
            )}

            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
              {plan.name}
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              {plan.description}
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                ${plan.price}
              </span>
              <span className="text-sm" style={{ color: colors.text.secondary }}>/month</span>
            </div>

            <ul className="space-y-2 mb-6 text-sm">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span style={{ color: colors.text.secondary }}>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.isCurrent ? (
              <button
                disabled
                className="w-full py-3 rounded-lg font-semibold bg-green-500 text-white opacity-60 cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : canUpgradeTo(plan.id) ? (
              <button
                onClick={() => router.push(`/dashboard/settings/billing/upgrade?plan=${plan.id}`)}
                className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                Upgrade to {plan.name}
              </button>
            ) : canDowngradeTo(plan.id) ? (
              <button
                onClick={() => router.push(`/dashboard/settings/billing/downgrade?plan=${plan.id}`)}
                className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                Downgrade to {plan.name}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {isActive && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.border.DEFAULT }}>
          <button
            onClick={() => router.push('/dashboard/settings/billing/cancel')}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Cancel subscription
          </button>
        </div>
      )}
    </div>
  )
}
