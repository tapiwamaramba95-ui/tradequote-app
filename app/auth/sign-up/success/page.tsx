'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { CheckCircle2, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { colors } from '@/lib/colors'

function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleResendEmail = () => {
    // This could trigger a resend verification email API call
    console.log('Resend verification email for:', email)
    // For now, just show a message
    alert('Verification email sent! Please check your inbox.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" 
                 style={{ backgroundColor: `${colors.primary.DEFAULT}15` }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: colors.primary.DEFAULT }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Account Created Successfully!
            </h1>
            <p className="text-gray-600">
              We've sent you a verification email
            </p>
          </div>

          {/* Email Info */}
          {email && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Check your email
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ backgroundColor: colors.primary.DEFAULT, color: 'white' }}>
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Check your email</p>
                  <p className="text-xs text-gray-600">Look for an email from TradeQuote with verification instructions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-200 text-gray-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Click "Verify Email Address"</p>
                  <p className="text-xs text-gray-600">This will confirm your email and activate your account</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-200 text-gray-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Complete your setup</p>
                  <p className="text-xs text-gray-600">Finish your business profile and start creating quotes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="text-amber-600 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-800">Didn't receive the email?</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Check your spam folder or 
                  <button 
                    onClick={handleResendEmail}
                    className="ml-1 font-medium underline hover:no-underline"
                    style={{ color: colors.primary.DEFAULT }}
                  >
                    resend verification email
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.open('https://gmail.com', '_blank')}
              className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Mail className="w-5 h-5" />
              Open Email App
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Sign In
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              The verification link will expire in 24 hours for security reasons.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary.DEFAULT }}></div>
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  )
}