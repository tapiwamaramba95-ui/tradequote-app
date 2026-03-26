'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { checkSubscriptionAccess } from '@/lib/subscription'

export default function ExpiredSubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [canReactivate, setCanReactivate] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        const subscriptionState = checkSubscriptionAccess(profileData)
        
        // If still has access, redirect back to dashboard
        if (subscriptionState.canAccess) {
          router.push('/dashboard')
          return
        }

        // Check if within 30-day reactivation window
        const accessUntil = profileData.access_until ? new Date(profileData.access_until) : null
        const now = new Date()
        const canReact = accessUntil !== null && accessUntil > now
        setCanReactivate(canReact)
      }

      setLoading(false)
    }

    checkStatus()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent.DEFAULT }}></div>
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: '#fee2e2' }}>
            <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: colors.text.primary }}>
            Subscription Expired
          </h1>
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            {canReactivate 
              ? "Your access period has ended, but you can still reactivate your account."
              : "Your access period has ended. Choose a plan to create a new account."}
          </p>
        </div>

        {canReactivate ? (
          <div className="rounded-xl p-8 mb-6" style={{ backgroundColor: colors.background.card, border: `1px solid ${colors.border.DEFAULT}` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.text.primary }}>
              Welcome Back! 👋
            </h2>
            <p className="mb-6" style={{ color: colors.text.secondary }}>
              Good news! You can still reactivate your account and restore full access to all your data:
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: colors.text.secondary }}>All your jobs, quotes, and invoices</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: colors.text.secondary }}>All your client information</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: colors.text.secondary }}>All your settings and customizations</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/settings/billing/reactivate')}
              className="w-full py-4 rounded-lg font-semibold text-white text-lg transition-colors mb-3"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Reactivate Your Account
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 rounded-lg font-medium transition-colors"
              style={{ color: colors.text.secondary, backgroundColor: colors.background.main }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-8 mb-6" style={{ backgroundColor: colors.background.card, border: `1px solid ${colors.border.DEFAULT}` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.text.primary }}>
              Data Has Been Deleted
            </h2>
            <p className="mb-6" style={{ color: colors.text.secondary }}>
              Your 30-day grace period has ended and your data has been permanently deleted. 
              You'll need to create a new account to use TradeQuote.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 rounded-lg font-semibold text-white text-lg transition-colors"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                Create New Account
              </button>

              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-lg font-medium transition-colors"
                style={{ color: colors.text.secondary, backgroundColor: colors.background.main }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Need help? Contact us at{' '}
            <a href="mailto:support@tradequote.au" className="underline" style={{ color: colors.accent.DEFAULT }}>
              support@tradequote.au
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
