'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface User {
  business_name?: string
  first_name?: string
}

export default function WelcomeBanner() {
  const [user, setUser] = useState<User | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  useEffect(() => {
    checkWelcomeBannerStatus()
  }, [])

  const checkWelcomeBannerStatus = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      setLoading(false)
      return
    }

    // Check onboarding progress
    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('company_profile_completed, invoice_settings_completed, first_quote_created')
      .eq('user_id', authUser.id)
      .single()

    // If onboarding is complete, don't show banner
    if (progress && progress.company_profile_completed && progress.invoice_settings_completed && progress.first_quote_created) {
      setOnboardingComplete(true)
      setLoading(false)
      return
    }

    // Check if this is first dashboard visit
    const lastVisit = localStorage.getItem('last_dashboard_visit')
    const now = new Date().toISOString()
    
    if (!lastVisit) {
      setIsFirstVisit(true)
      localStorage.setItem('last_dashboard_visit', now)
    }

    // Check if banner was dismissed in this session
    const sessionDismissed = sessionStorage.getItem('welcome_banner_dismissed')
    if (sessionDismissed) {
      setDismissed(true)
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('business_name, first_name')
      .eq('id', authUser.id)
      .single()

    setUser(profile || {})
    setLoading(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('welcome_banner_dismissed', 'true')
  }

  if (loading || dismissed || onboardingComplete || !isFirstVisit) return null

  const displayName = user?.business_name || user?.first_name || 'there'

  return (
    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl p-6 text-white relative overflow-hidden mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-8 transform rotate-12">
          <Star className="w-8 h-8" />
        </div>
        <div className="absolute bottom-6 right-16 transform -rotate-12">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="absolute top-8 right-32 transform rotate-45">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss} 
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1"
        title="Dismiss until next visit"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to TradeQuote, {displayName}! 🎉</h2>
            <p className="text-cyan-100 text-lg">Let's help you win more trades with professional quotes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold">Professional Quotes</h3>
            </div>
            <p className="text-cyan-100 text-sm">Create stunning quotes that win jobs and make you look professional</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold">Track Jobs</h3>
            </div>
            <p className="text-cyan-100 text-sm">Monitor your quote acceptance rate and job pipeline in real-time</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold">Get Paid Faster</h3>
            </div>
            <p className="text-cyan-100 text-sm">Send professional invoices and track payments with automated reminders</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Link 
            href="/dashboard/quotes/new"
            className="bg-white text-cyan-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Create Your First Quote
          </Link>
          <Link 
            href="/onboarding"
            className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"
          >
            Complete Setup
          </Link>
        </div>
      </div>
    </div>
  )
}