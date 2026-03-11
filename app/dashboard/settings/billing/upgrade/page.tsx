'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 39,
    description: 'Perfect for solo tradies just getting started',
    features: [
      'Unlimited jobs, quotes & invoices',
      '1 user (solo tradie)',
      'Client management',
      'Basic scheduler/calendar',
      'Mobile app',
      'Email support',
    ],
  },
  professional: {
    name: 'Professional',
    price: 49,
    description: 'For tradies with a small team',
    features: [
      'Everything in Starter',
      'Up to 5 staff members',
      'Timesheets & time tracking',
      'Purchase orders & suppliers',
      'Analytics & reports',
      'Google Calendar sync',
      'Stripe payments (optional)',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    price: 89,
    description: 'For growing businesses with multiple crews',
    features: [
      'Everything in Professional',
      'Unlimited staff',
      'Custom branding (logo on docs)',
      'Advanced reporting',
      'Multi-location support',
      'API access',
      'Dedicated account manager',
      'Priority support',
    ],
  },
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams?.get('plan') as 'starter' | 'professional' | 'business' | null
  
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'business'>(
    planParam || 'professional'
  )
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [error, setError] = useState('')

  const plan = PLAN_DETAILS[selectedPlan]
  const monthlyPrice = plan.price
  const yearlyPrice = Math.floor(plan.price * 12 * 0.8) // 20% discount for yearly
  const displayPrice = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // In production, you would:
      // 1. Create/retrieve Stripe customer
      // 2. Create Stripe checkout session
      // 3. Redirect to Stripe checkout
      // 4. Handle webhook to update subscription status

      // For now, simulate successful subscription
      alert(`Redirecting to Stripe checkout for ${plan.name} plan... (Not implemented yet)`)
      
      // Demo: Update subscription directly (remove this in production)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: selectedPlan,
          billing_period: billingPeriod,
          subscription_started_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Redirect back to billing page
      router.push('/dashboard/settings/billing')

    } catch (err: any) {
      setError(err.message || 'Failed to start subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-sm font-semibold"
        style={{ color: colors.accent.DEFAULT }}
      >
        ← Back to Billing
      </button>

      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
        Upgrade to {plan.name}
      </h1>
      <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
        {plan.description}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Plan Details */}
        <div>
          {/* Billing Period Toggle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              Billing Period
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              What's Included
            </h3>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span style={{ color: colors.text.secondary }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column - Checkout */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold mb-6" style={{ color: colors.text.primary }}>
              Order Summary
            </h3>

            {/* Plan Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                Select Plan
              </label>
              <div className="space-y-2">
                {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedPlan === key
                        ? 'border-2 bg-orange-50'
                        : 'border-2 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: selectedPlan === key ? colors.accent.DEFAULT : colors.border.DEFAULT,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: colors.text.primary }}>
                          {PLAN_DETAILS[key].name}
                        </p>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          ${PLAN_DETAILS[key].price}/month
                        </p>
                      </div>
                      {key === 'professional' && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold">
                          POPULAR
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-b py-4 mb-6" style={{ borderColor: colors.border.DEFAULT }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: colors.text.secondary }}>
                  {plan.name} Plan ({billingPeriod})
                </span>
                <span className="font-semibold" style={{ color: colors.text.primary }}>
                  ${displayPrice}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.text.secondary }}>
                    You save
                  </span>
                  <span className="font-semibold text-green-600">
                    ${(monthlyPrice * 12 - yearlyPrice).toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold" style={{ color: colors.text.primary }}>
                Total due {billingPeriod === 'monthly' ? 'today' : 'annually'}
              </span>
              <span className="text-2xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                ${displayPrice}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: colors.text.secondary }}>
              Your subscription will renew automatically. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="font-semibold mb-1" style={{ color: colors.text.primary }}>
              Secure Payment
            </h4>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Your payment information is encrypted and secure
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">↩️</div>
            <h4 className="font-semibold mb-1" style={{ color: colors.text.primary }}>
              Money-Back Guarantee
            </h4>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Not satisfied? Get a full refund within 30 days
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold mb-1" style={{ color: colors.text.primary }}>
              Cancel Anytime
            </h4>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              No lock-in contracts. Cancel your subscription anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
