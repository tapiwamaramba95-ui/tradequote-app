'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Profile = {
  subscription_status: string
  subscription_plan: string
  billing_period: string
  trial_ends_at: string
  subscription_started_at: string
  stripe_customer_id: string
  stripe_subscription_id: string
}

type PaymentMethod = {
  id: string
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
}

type BillingHistory = {
  id: string
  amount: number
  status: string
  billing_period_start: string
  billing_period_end: string
  invoice_pdf_url: string
  paid_at: string
  created_at: string
}

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)

        // Calculate trial days remaining
        if (profileData.trial_ends_at) {
          const trialEnd = new Date(profileData.trial_ends_at)
          const now = new Date()
          const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setDaysRemaining(Math.max(days, 0))
        }
      }

      // Load payment methods
      const { data: pmData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (pmData) setPaymentMethods(pmData)

      // Load billing history
      const { data: bhData } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (bhData) setBillingHistory(bhData)

    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradePlan = (plan: 'starter' | 'professional' | 'business') => {
    router.push(`/dashboard/settings/billing/upgrade?plan=${plan}`)
  }

  const handleDowngradePlan = () => {
    router.push('/dashboard/settings/billing/downgrade')
  }

  const handleCancelSubscription = () => {
    router.push('/dashboard/settings/billing/cancel')
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
  const isMonthly = profile?.billing_period === 'monthly'

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8" style={{ color: colors.text.primary }}>
        Billing & Payments
      </h1>

      {/* Trial Banner */}
      {isOnTrial && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                ⏰ {daysRemaining} days left in your trial
              </h3>
              <p className="text-sm text-blue-700">
                Choose a plan to continue using TradeQuote after your trial ends
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/settings/billing/upgrade')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Choose Plan
            </button>
          </div>
        </div>
      )}

      {/* Current Plan */}
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
                {isStarter ? '$20' : isProfessional ? '$30' : '$79'}/{isMonthly ? 'month' : 'year'}
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
                  onClick={() => handleUpgradePlan('professional')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Upgrade to Professional
                </button>
              )}
              {isProfessional && (
                <button
                  onClick={() => handleUpgradePlan('business')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Upgrade to Business
                </button>
              )}
              {isBusiness && (
                <button
                  onClick={handleDowngradePlan}
                  className="px-4 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                >
                  Downgrade
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plan Features */}
        {isActive && (
          <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
            <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
              Your plan includes:
            </h4>
            <ul className="grid grid-cols-2 gap-3 text-sm" style={{ color: colors.text.secondary }}>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Unlimited jobs, quotes & invoices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {isStarter ? '1 user (solo tradie)' : isProfessional ? 'Up to 5 staff members' : 'Unlimited staff'}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Client management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {isStarter ? 'Basic scheduler/calendar' : 'Advanced scheduler'}
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
                    Timesheets & time tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Purchase orders & suppliers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Analytics & reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Google Calendar sync
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Stripe payments (optional)
                  </li>
                </>
              )}
              {isBusiness && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Custom branding (logo on docs)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Advanced reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Multi-location support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    API access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Dedicated account manager
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Cancel Subscription */}
        {isActive && (
          <div className="border-t mt-6 pt-6" style={{ borderColor: colors.border.DEFAULT }}>
            <button
              onClick={handleCancelSubscription}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Compare Plans */}
      {!isActive && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Choose Your Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="border-2 rounded-xl p-6" style={{ borderColor: colors.border.DEFAULT }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Starter
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                Perfect for solo tradies just getting started
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $20
                </span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  /month
                </span>
              </div>
              <ul className="space-y-2 text-sm mb-6" style={{ color: colors.text.secondary }}>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Unlimited jobs, quotes & invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  1 user (solo tradie)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Client management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Basic scheduler/calendar
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Mobile app
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Email support
                </li>
              </ul>
              <button
                onClick={() => handleUpgradePlan('starter')}
                className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
              >
                Choose Starter
              </button>
            </div>

            {/* Professional Plan */}
            <div className="border-2 rounded-xl p-6 relative" style={{ borderColor: colors.accent.DEFAULT }}>
              <div className="absolute -top-3 right-4 px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Professional
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                For tradies with a small team
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $30
                </span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  /month
                </span>
              </div>
              <ul className="space-y-2 text-sm mb-6" style={{ color: colors.text.secondary }}>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Everything in Starter
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Up to 5 staff members
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Timesheets & time tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Purchase orders & suppliers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Analytics & reports
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Google Calendar sync
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Stripe payments (optional)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Priority support
                </li>
              </ul>
              <button
                onClick={() => handleUpgradePlan('professional')}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Choose Professional
              </button>
            </div>

            {/* Business Plan */}
            <div className="border-2 rounded-xl p-6" style={{ borderColor: colors.border.DEFAULT }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Business
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                For growing businesses with multiple crews
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  $79
                </span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  /month
                </span>
              </div>
              <ul className="space-y-2 text-sm mb-6" style={{ color: colors.text.secondary }}>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Everything in Professional
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Unlimited staff
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Custom branding (logo on docs)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Advanced reporting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Multi-location support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Priority support
                </li>
              </ul>
              <button
                onClick={() => handleUpgradePlan('business')}
                className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
              >
                Choose Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {isActive && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
              Payment Methods
            </h2>
            <button
              onClick={() => router.push('/dashboard/settings/billing/add-payment-method')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              + Add Card
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.text.secondary }}>
              <p>No payment methods added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 border-2 rounded-lg"
                  style={{ borderColor: pm.is_default ? colors.accent.DEFAULT : colors.border.DEFAULT }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                      {pm.card_brand === 'visa' && <span className="font-bold text-blue-600">VISA</span>}
                      {pm.card_brand === 'mastercard' && <span className="font-bold text-red-600">MC</span>}
                      {pm.card_brand === 'amex' && <span className="font-bold text-blue-500">AMEX</span>}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: colors.text.primary }}>
                        •••• •••• •••• {pm.card_last4}
                      </p>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Expires {pm.card_exp_month}/{pm.card_exp_year}
                      </p>
                    </div>
                    {pm.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!pm.is_default && (
                      <button className="text-sm font-semibold" style={{ color: colors.accent.DEFAULT }}>
                        Set as default
                      </button>
                    )}
                    <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing History */}
      {isActive && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Billing History
          </h2>

          {billingHistory.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.text.secondary }}>
              <p>No billing history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: colors.border.DEFAULT }}>
                    <th className="text-left py-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      DATE
                    </th>
                    <th className="text-left py-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      AMOUNT
                    </th>
                    <th className="text-left py-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      STATUS
                    </th>
                    <th className="text-right py-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      INVOICE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item) => (
                    <tr key={item.id} className="border-b" style={{ borderColor: colors.border.DEFAULT }}>
                      <td className="py-4" style={{ color: colors.text.primary }}>
                        {new Date(item.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td className="py-4 font-semibold" style={{ color: colors.text.primary }}>
                        ${item.amount.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: item.status === 'succeeded' ? '#dcfce7' : '#fef2f2',
                            color: item.status === 'succeeded' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {item.invoice_pdf_url && (
                          <a
                            href={item.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold"
                            style={{ color: colors.accent.DEFAULT }}
                          >
                            Download PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
