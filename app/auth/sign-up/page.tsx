'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { FileText, Mail, Phone, Lock, Building2, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'

const TRADE_TYPES = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Landscaper',
  'Builder',
  'HVAC',
  'Roofing',
  'Tiling',
  'Concreting',
  'Demolition',
  'Other',
]

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [tradeType, setTradeType] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing. Please contact support.')
      }

      // Validate
      if (!agreedToTerms) {
        setError('Please agree to the Terms of Service')
        setLoading(false)
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        setLoading(false)
        return
      }

      if (!phone) {
        setError('Phone number is required')  
        setLoading(false)
        return
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            business_name: businessName,
            trade_type: tradeType,
            phone: phone,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // 2. Update profile with business details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          trade_type: tradeType,
          phone: phone,
          subscription_status: 'trial',
          trial_started_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      // ✅ Mark business details as complete if provided  
      if (businessName && tradeType && phone) {
        await supabase
          .from('onboarding_progress')
          .update({ 
            business_details_added: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', authData.user.id)
      }

      // 3. Send to dashboard
      router.push('/dashboard?welcome=true')

    } catch (error: any) {
      console.error('Sign up error:', error)
      
      // Provide better error messages
      let errorMessage = 'Failed to create account'
      
      if (error.message?.includes('Database error') || error.message?.includes('connection')) {
        errorMessage = 'Unable to connect to database. Please check your internet connection and try again.'
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.'
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message?.includes('Weak password')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.'
      } else if (error.message?.includes('Supabase configuration')) {
        errorMessage = error.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          {/* Logo with Icon Badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-7 h-7 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              TradeQuote
            </h1>
          </div>
          
          {/* Badge-style subheading */}
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-full mb-3">
            <p className="text-sm font-semibold text-orange-900">Start Your 14-Day Free Trial</p>
          </div>
          
          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime
          </p>
        </div>

        {/* Sign-Up Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
                  placeholder="Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => {
                    const normalized = normalizeEmail(e.target.value)
                    setEmail(normalized)
                    
                    // Check for typos
                    const suggestion = suggestEmailCorrection(normalized)
                    setEmailSuggestion(suggestion)
                    
                    // Validate
                    if (normalized && !isValidEmail(normalized)) {
                      setEmailError('Please enter a valid email address')
                    } else {
                      setEmailError('')
                    }
                  }}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="john@smithplumbing.com.au"
                />
              </div>
              {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
              {emailSuggestion && !emailError && (
                <button 
                  type="button"
                  onClick={() => {
                    setEmail(emailSuggestion)
                    setEmailSuggestion(null)
                  }}
                  className="text-sm text-cyan-600 hover:text-cyan-700 mt-1"
                >
                  Did you mean {emailSuggestion}?
                </button>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={(e) => {
                    const formatted = formatAustralianPhone(e.target.value)
                    setPhone(formatted)
                    
                    if (formatted && !isValidAustralianPhone(formatted)) {
                      setPhoneError('Please enter a valid Australian phone number')
                    } else {
                      setPhoneError('')
                    }
                  }}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0412 345 678"
                />
              </div>
              {phoneError ? (
                <p className="text-sm text-red-600 mt-1">{phoneError}</p>
              ) : (
                <p className="text-xs mt-1.5 text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  For support and onboarding help
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs mt-1.5 text-gray-500">
                Minimum 8 characters
              </p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Business Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors"
                  placeholder="Smith Plumbing"
                />
              </div>
              <p className="text-xs mt-1.5 text-gray-500">
                Appears on quotes & invoices
              </p>
            </div>

            {/* Trade Type */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                I'm a
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                </div>
                <select
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors appearance-none bg-white"
                >
                  <option value="">Select your trade...</option>
                  {TRADE_TYPES.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <label className="text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-orange-600 hover:text-orange-700 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-orange-600 hover:text-orange-700 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg font-bold text-orange-600 bg-white border-2 border-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 hover:bg-orange-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating account...
                </span>
              ) : (
                <>Start Free Trial →</>
              )}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>14-Day Trial</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Cancel Anytime</span>
              </div>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm mt-4 text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
