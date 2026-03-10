'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface OnboardingProgress {
  account_created: boolean
  business_details_added: boolean
  company_profile_completed: boolean
  invoice_settings_completed: boolean
  first_quote_created: boolean
  widget_dismissed: boolean
}

export default function OnboardingChecklist() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
    
    // ✅ Subscribe to real-time changes in onboarding progress
    const channel = supabase
      .channel('onboarding-progress-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'onboarding_progress'
        },
        (payload) => {
          // Refresh progress when updated
          console.log('Progress updated:', payload)
          fetchProgress()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('onboarding_progress')
      .select('*')
      .single()
    
    if (data) {
      setProgress(data)
      setDismissed(data.widget_dismissed || false)
    }
    setLoading(false)
  }

  const handleDismiss = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('onboarding_progress')
      .update({ 
        widget_dismissed: true,
        widget_dismissed_at: new Date().toISOString()
      })
      .eq('user_id', user?.id)
    
    setDismissed(true)
  }

  if (loading || !progress || dismissed) return null

  // Check if complete
  const completedSteps = [
    progress.account_created,
    progress.business_details_added,
    progress.company_profile_completed,
    progress.invoice_settings_completed,
    progress.first_quote_created
  ]
  const completedCount = completedSteps.filter(Boolean).length
  const isComplete = completedCount === 5

  // Hide if 100% complete
  if (isComplete) return null

  const totalSteps = 5
  const percentage = Math.round((completedCount / totalSteps) * 100)

  const steps = [
    {
      id: 'account',
      title: 'Create your account',
      description: 'Welcome aboard! Your account is ready.',
      completed: progress.account_created,
      link: null
    },
    {
      id: 'business',
      title: 'Add your business details',
      description: 'Business name and trade type',
      completed: progress.business_details_added,
      link: null
    },
    {
      id: 'profile',
      title: 'Complete your company profile',
      description: 'Add ABN, address, and company logo',
      completed: progress.company_profile_completed,
      link: '/dashboard/settings/company'
    },
    {
      id: 'invoice',
      title: 'Set up your invoice settings',
      description: 'Bank details and payment terms',
      completed: progress.invoice_settings_completed,
      link: '/dashboard/settings/invoice'
    },
    {
      id: 'quote',
      title: 'Create your first quote',
      description: 'Try creating a test quote',
      completed: progress.first_quote_created,
      link: '/dashboard/quotes/new'
    }
  ]

  const nextStep = steps.find(s => !s.completed)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Get Started with TradeQuote</h3>
            <p className="text-sm text-gray-600">Complete these steps to start winning jobs</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Dismiss (will reappear next visit)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Setup Progress</span>
          <span className="text-sm font-bold text-cyan-600">{completedCount} of {totalSteps} complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="from-orange-500 to-orange-600 rounded-full h-2 transition-all duration-500 ease-out"
            style={{ 
              background: 'linear-gradient(to right, #ea580c, #dc2626)',
              width: `${percentage}%`
            }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {steps.map((step) => (
          <ChecklistItem
            key={step.id}
            {...step}
            isNext={step.id === nextStep?.id}
          />
        ))}
      </div>
    </div>
  )
}

function ChecklistItem({ title, description, completed, link, isNext }: any) {
  const content = (
    <>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
        completed 
          ? 'bg-green-600' 
          : 'bg-white border-2 border-gray-300'
      }`}>
        {completed ? (
          <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
        ) : (
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{title}</h4>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{description}</p>
          </div>
          {!completed && link && (
            <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
              isNext ? 'text-cyan-600' : 'text-gray-400'
            }`} />
          )}
        </div>
      </div>
    </>
  )

  const className = `flex items-start gap-3 p-3 rounded-lg transition-all ${
    completed 
      ? 'bg-green-50 border border-green-200'
      : isNext
        ? 'bg-orange-50 border-2 border-orange-300 hover:border-orange-400 cursor-pointer hover:shadow-sm'
        : 'border border-gray-200 hover:border-gray-300 cursor-pointer'
  }`

  if (!link || completed) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link href={link} className={className}>
      {content}
    </Link>
  )
}