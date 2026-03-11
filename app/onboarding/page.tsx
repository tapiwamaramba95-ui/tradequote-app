'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { CheckCircle2, Building2, DollarSign, FileText, ArrowRight, ArrowLeft, X } from 'lucide-react'
import AddressInput from '@/components/AddressInput'

type Step = 'profile' | 'invoice' | 'quote' | 'complete'

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state  
  const [businessName, setBusinessName] = useState('')
  const [tradeType, setTradeType] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [abn, setAbn] = useState('')
  const [address, setAddress] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('14')

  useEffect(() => {
    checkProgress()
  }, [])

  const checkProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('*')
      .single()
    
    if (!progress) {
      router.push('/dashboard')
      return
    }

    // Load business information from profiles table to pre-populate
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, trade_type, phone')
      .eq('id', user?.id)
      .single()

    if (profile) {
      setBusinessName(profile.business_name || '')
      setTradeType(profile.trade_type || '')
      setPhoneNumber(profile.phone || '')
      
      // Also set the account name to the business name by default
      setAccountName(profile.business_name || '')
    }

    // Determine starting step based on what's already completed
    if (!progress.company_profile_completed) {
      setCurrentStep('profile')
    } else if (!progress.invoice_settings_completed) {
      setCurrentStep('invoice')
    } else if (!progress.first_quote_created) {
      setCurrentStep('quote')
    } else {
      setCurrentStep('complete')
    }

    setLoading(false)
  }

  const handleSkipAll = async () => {
    // Mark wizard as skipped
    await supabase
      .from('onboarding_progress')
      .update({ wizard_skipped: true })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    
    router.push('/dashboard')
  }

  const handleProfileSubmit = async () => {
    if (!abn || !address) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Save to business_settings (including info from sign-up)
      const { error } = await supabase
        .from('business_settings')
        .update({ 
          company_name: businessName,
          company_email: user?.email,
          company_phone: phoneNumber,
          trade_type: tradeType,
          abn,
          company_address: address,
          company_logo_url: logo ? 'pending-upload' : null // Handle file upload separately
        })
        .eq('user_id', user?.id)

      if (!error) {
        // Mark step complete
        await supabase
          .from('onboarding_progress')
          .update({ 
            company_profile_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)
        
        setCurrentStep('invoice')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleInvoiceSubmit = async () => {
    if (!bsb || !accountNumber || !accountName) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Save to business_settings
      const { error } = await supabase
        .from('business_settings')
        .update({ 
          bsb,
          account_number: accountNumber,
          account_name: accountName,
          payment_terms: parseInt(paymentTerms)
        })
        .eq('user_id', user?.id)

      if (!error) {
        // Mark step complete
        await supabase
          .from('onboarding_progress')
          .update({ 
            invoice_settings_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)
        
        setCurrentStep('quote')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleQuoteAction = () => {
    // Redirect to create quote page
    router.push('/dashboard/quotes/new?onboarding=true')
  }

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Mark wizard complete
    await supabase
      .from('onboarding_progress')
      .update({ 
        wizard_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user?.id)

    router.push('/dashboard?welcome=true')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip Button (Fixed Top Right) */}
      <button
        onClick={handleSkipAll}
        className="fixed top-6 right-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium z-10"
      >
        Skip setup →
      </button>

      {/* Progress Steps Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <StepIndicator
              number={1}
              title="Company Profile"
              active={currentStep === 'profile'}
              completed={currentStep !== 'profile'}
            />
            <ProgressLine completed={currentStep !== 'profile'} />

            <StepIndicator
              number={2}
              title="Bank Details"
              active={currentStep === 'invoice'}
              completed={currentStep === 'quote' || currentStep === 'complete'}
            />
            <ProgressLine completed={currentStep === 'quote' || currentStep === 'complete'} />

            <StepIndicator
              number={3}
              title="First Quote"
              active={currentStep === 'quote'}
              completed={currentStep === 'complete'}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {currentStep === 'profile' && (
            <ProfileStep
              businessName={businessName}
              setBusinessName={setBusinessName}
              tradeType={tradeType}
              setTradeType={setTradeType}  
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              abn={abn}
              setAbn={setAbn}
              address={address}
              setAddress={setAddress}
              onSubmit={handleProfileSubmit}
              onSkip={() => setCurrentStep('invoice')}
              saving={saving}
            />
          )}

          {currentStep === 'invoice' && (
            <InvoiceStep
              bsb={bsb}
              setBsb={setBsb}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              accountName={accountName}
              setAccountName={setAccountName}
              paymentTerms={paymentTerms}
              setPaymentTerms={setPaymentTerms}
              onSubmit={handleInvoiceSubmit}
              onBack={() => setCurrentStep('profile')}
              onSkip={() => setCurrentStep('quote')}
              saving={saving}
            />
          )}

          {currentStep === 'quote' && (
            <QuoteStep
              onAction={handleQuoteAction}
              onBack={() => setCurrentStep('invoice')}
              onSkip={handleComplete}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep onContinue={handleComplete} />
          )}
        </div>
      </div>
    </div>
  )
}

// Step Indicator Component
function StepIndicator({ number, title, active, completed }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        completed 
          ? 'bg-green-600' 
          : active 
            ? 'bg-orange-600' 
            : 'bg-gray-200'
      }`}>
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : (
          <span className={`font-bold ${active ? 'text-white' : 'text-gray-500'}`}>
            {number}
          </span>
        )}
      </div>
      <div className="hidden sm:block">
        <p className={`text-xs font-semibold uppercase ${
          active ? 'text-orange-600' : completed ? 'text-green-600' : 'text-gray-500'
        }`}>
          Step {number}
        </p>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
      </div>
    </div>
  )
}

function ProgressLine({ completed }: { completed: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mx-4 transition-all ${
      completed ? 'bg-green-600' : 'bg-gray-300'
    }`} />
  )
}

// Profile Step Component
function ProfileStep({ 
  businessName, setBusinessName, 
  tradeType, setTradeType, 
  phoneNumber, setPhoneNumber,
  abn, setAbn, 
  address, setAddress, 
  onSubmit, onSkip, saving 
}: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Company Profile</h2>
        <p className="text-gray-600">These details appear on your quotes and invoices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-populated from sign-up */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">From your sign-up</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Trade Type
          </label>
          <input
            type="text"
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value)}
            placeholder="e.g., Electrician, Plumber"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">From your sign-up</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0412 345 678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">From your sign-up</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            ABN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            placeholder="12 345 678 901"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Australian Business Number</p>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Business Address <span className="text-red-500">*</span>
        </label>
        <AddressInput
          value={address}
          onChange={setAddress}
          placeholder="This appears on invoices and quotes"
        />
        <p className="text-xs text-gray-500 mt-1">This appears on invoices and quotes</p>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Skip this step
        </button>
        <button
          onClick={onSubmit}
          disabled={!abn || !address || saving}
          className="flex-1 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-all"
          style={{ 
            backgroundColor: colors.primary,
            color: 'white',
          }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Invoice Step Component
function InvoiceStep({ bsb, setBsb, accountNumber, setAccountNumber, accountName, setAccountName, paymentTerms, setPaymentTerms, onSubmit, onBack, onSkip, saving }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Bank Details</h2>
        <p className="text-gray-600">Where you'll receive payments from customers</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              BSB <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bsb}
              onChange={(e) => setBsb(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
              placeholder="123-456"
              maxLength={7}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="12345678"
              maxLength={9}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Account Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Smith Plumbing Pty Ltd"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Payment Terms
          </label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
          >
            <option value="0">Due on receipt</option>
            <option value="7">Net 7 days</option>
            <option value="14">Net 14 days</option>
            <option value="30">Net 30 days</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <p className="text-sm text-blue-900">
              <strong>Your data is secure.</strong> Bank details are encrypted and only shown on invoices you send.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onSubmit}
            disabled={!bsb || !accountNumber || !accountName || saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Quote Step Component
function QuoteStep({ onAction, onBack, onSkip }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set! 🎉</h2>
        <p className="text-gray-600">Time to create your first quote and win your first job</p>
      </div>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">What happens next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Create a quote for a customer</p>
              <p className="text-xs text-gray-600">Add line items, pricing, and terms</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Send it to your customer</p>
              <p className="text-xs text-gray-600">They can accept online with one click</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Get paid faster</p>
              <p className="text-xs text-gray-600">Convert to invoice and track payments</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          I'll do this later
        </button>
        <button
          onClick={onAction}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-bold hover:from-cyan-700 hover:to-blue-700 inline-flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          Create My First Quote
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Complete Step Component
function CompleteStep({ onContinue }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">All Done! 🎉</h2>
      <p className="text-lg text-gray-600 mb-8">Your account is fully set up and ready to go</p>
      
      <button
        onClick={onContinue}
        className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-lg rounded-lg font-bold hover:from-cyan-700 hover:to-blue-700 shadow-lg transition-all"
      >
        Go to Dashboard →
      </button>
    </div>
  )
}