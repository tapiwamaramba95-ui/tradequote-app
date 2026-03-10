'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

type CancellationReason = 
  | 'too_expensive' 
  | 'missing_features' 
  | 'too_complicated' 
  | 'switching' 
  | 'no_longer_needed' 
  | 'just_trying' 
  | 'other'

export default function CancelSubscriptionPage() {
  const router = useRouter()
  const [step, setStep] = useState<'reason' | 'retention' | 'confirm'>('reason')
  const [loading, setLoading] = useState(false)
  
  const [reason, setReason] = useState<CancellationReason | ''>('')
  const [feedback, setFeedback] = useState('')
  const [retentionOfferShown, setRetentionOfferShown] = useState<string | null>(null)

  const [stats, setStats] = useState({
    jobs: 0,
    quotes: 0,
    invoices: 0,
    clients: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user stats
      const [jobsData, quotesData, invoicesData, clientsData] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      setStats({
        jobs: jobsData.count || 0,
        quotes: quotesData.count || 0,
        invoices: invoicesData.count || 0,
        clients: clientsData.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleReasonSubmit = () => {
    if (!reason) {
      alert('Please select a reason')
      return
    }

    // Show retention offer based on reason
    if (reason === 'too_expensive') {
      setRetentionOfferShown('discount_50_percent')
      setStep('retention')
    } else if (reason === 'missing_features') {
      setRetentionOfferShown('feature_request')
      setStep('retention')
    } else if (reason === 'too_complicated') {
      setRetentionOfferShown('setup_call')
      setStep('retention')
    } else {
      // Go straight to confirmation
      setStep('confirm')
    }
  }

  const handleRetentionAccept = async () => {
    // Handle retention offer acceptance
    if (retentionOfferShown === 'discount_50_percent') {
      // Apply 50% discount for 3 months
      // TODO: Integrate with Stripe
      alert('Discount applied! Check your email for details.')
      router.push('/dashboard/settings/billing')
    } else if (retentionOfferShown === 'feature_request') {
      // Save feature request
      router.push('/dashboard/settings/billing')
    } else if (retentionOfferShown === 'setup_call') {
      // Redirect to booking
      window.open('https://calendly.com/tradequote/setup-call', '_blank')
      router.push('/dashboard/settings/billing')
    }
  }

  const handleFinalCancel = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const accessUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          cancelled_at: now.toISOString(),
          access_until: accessUntil.toISOString(),
          deletion_scheduled_at: deletionDate.toISOString(),
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Log cancellation
      const { error: cancellationError } = await supabase
        .from('cancellations')
        .insert({
          user_id: user.id,
          cancelled_at: now.toISOString(),
          cancellation_reason: reason,
          cancellation_feedback: feedback,
          retention_offer_shown: retentionOfferShown,
          retention_offer_accepted: false,
          jobs_created: stats.jobs,
          quotes_created: stats.quotes,
          invoices_created: stats.invoices,
          data_deletion_date: deletionDate.toISOString().split('T')[0],
        })

      if (cancellationError) throw cancellationError

      // Send cancellation email (TODO: Implement email sending)
      
      // Redirect to confirmation
      router.push('/dashboard/settings/billing/cancelled')

    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* STEP 1: Reason */}
      {step === 'reason' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
            We're sorry to see you go 😢
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            Before you cancel, can you tell us why?
          </p>

          <div className="space-y-3 mb-6">
            {[
              { value: 'too_expensive', label: 'Too expensive' },
              { value: 'missing_features', label: 'Missing features I need' },
              { value: 'too_complicated', label: 'Too complicated to use' },
              { value: 'switching', label: 'Switching to another tool' },
              { value: 'no_longer_needed', label: 'No longer need it' },
              { value: 'just_trying', label: 'Just trying it out' },
              { value: 'other', label: 'Other' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: reason === option.value ? colors.accent.DEFAULT : colors.border.DEFAULT }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={(e) => setReason(e.target.value as CancellationReason)}
                  className="w-5 h-5"
                  style={{ accentColor: colors.accent.DEFAULT }}
                />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {reason === 'other' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Please tell us more
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg text-sm resize-none"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="Your feedback helps us improve..."
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              Keep My Account
            </button>
            <button
              onClick={handleReasonSubmit}
              disabled={!reason}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Continue to Cancel
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Retention Offer */}
      {step === 'retention' && retentionOfferShown === 'discount_50_percent' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
            💰 Special Offer Just For You
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            We'd love to keep you! How about:
          </p>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white text-center mb-6">
            <div className="text-5xl font-bold mb-2">50% OFF</div>
            <div className="text-xl mb-4">for the next 3 months</div>
            <div className="text-lg opacity-90">
              Pay just <strong>$15/month</strong>
            </div>
            <div className="text-sm opacity-75 mt-2">
              This saves you $45!
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              No Thanks, Cancel
            </button>
            <button
              onClick={handleRetentionAccept}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Accept Discount
            </button>
          </div>
        </div>
      )}

      {step === 'retention' && retentionOfferShown === 'feature_request' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
            🛠️ Tell Us What You Need
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            We're actively building new features!
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
              What feature would make you stay?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 rounded-lg text-sm resize-none"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="I really need..."
            />
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Coming Soon:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Inventory management</li>
              <li>• Mobile app improvements</li>
              <li>• Advanced reporting</li>
              <li>• Xero & MYOB integration</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              Still Want to Cancel
            </button>
            <button
              onClick={handleRetentionAccept}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Keep Account & Get Updates
            </button>
          </div>
        </div>
      )}

      {step === 'retention' && retentionOfferShown === 'setup_call' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
            📞 Let Us Help!
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            We offer free 1-on-1 setup calls!
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Book a 15-minute call and we'll:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Show you the key features</li>
              <li>• Set up your account properly</li>
              <li>• Answer all your questions</li>
              <li>• Get you up and running</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              No Thanks, Cancel
            </button>
            <button
              onClick={handleRetentionAccept}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Book Free Setup Call
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Final Confirmation */}
      {step === 'confirm' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
              Confirm Cancellation
            </h1>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <p className="font-semibold text-red-900 mb-4">
              Your subscription will be cancelled and you'll lose access to:
            </p>
            <ul className="space-y-2 text-sm text-red-800">
              <li>• <strong>{stats.jobs}</strong> active jobs</li>
              <li>• <strong>{stats.clients}</strong> clients</li>
              <li>• <strong>{stats.quotes + stats.invoices}</strong> quotes & invoices</li>
              <li>• All your data and files</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">⏰ Grace Period: 30 days</h3>
            <p className="text-sm text-blue-800">
              You can reactivate within 30 days and keep all your data.
              After 30 days, all data will be <strong>permanently deleted</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              I Changed My Mind
            </button>
            <button
              onClick={handleFinalCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#dc2626' }}
            >
              {loading ? 'Cancelling...' : 'Yes, Cancel My Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

