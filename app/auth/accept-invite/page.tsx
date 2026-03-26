'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)
  const [invitationValid, setInvitationValid] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function verifyInvitation() {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        
        if (!token || type !== 'invite') {
          setError('Invalid invitation link')
          setVerifying(false)
          return
        }

        const { data, error } = await supabase.auth.getUser()
        
        if (error && error.message !== 'User not found') {
          setError('Unable to verify invitation')
          setVerifying(false)
          return
        }
        
        // If we got here, the token is valid
        setEmail(data.user?.email || null)
        setInvitationValid(true)
      } catch (err) {
        setError('An error occurred while verifying your invitation')
      } finally {
        setVerifying(false)
      }
    }

    verifyInvitation()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // Update staff record to mark as accepted
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error: staffError } = await supabase
          .from('staff')
          .update({ 
            accepted_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('user_id', user.id)

        if (staffError) {
          console.error('Failed to update staff record:', staffError)
          // Don't throw - user can still login
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setIsLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" style={{ borderBottomColor: colors.accent.DEFAULT }}></div>
          <p className="text-gray-600 mt-4">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is invalid or has expired. Please contact your administrator for a new invitation.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-orange-500 hover:text-orange-600 font-medium"
              style={{ color: colors.accent.DEFAULT }}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Accept Invitation
          </h1>
          <p className="text-gray-600 text-center">
            Create your password to complete setup
          </p>
          {email && (
            <p className="text-sm text-gray-500 text-center mt-2">
              {email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
