'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { UserCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Connection } from '@/lib/connections/types'

function AcceptConnectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (token) {
      loadConnection()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token])
  
  const loadConnection = async () => {
    if (!token) return
    
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('id', token)
        .single()
      
      if (error || !data) {
        setError('Invalid or expired invitation')
        setLoading(false)
        return
      }
      
      setConnection(data)
    } catch (err) {
      console.error('Error loading connection:', err)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }
  
  const acceptInvitation = async () => {
    if (!token) return
    
    setAccepting(true)
    setError(null)
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to signup with return URL
        router.push(`/auth/signup?connection=${token}&redirect=/connections/accept?token=${token}`)
        return
      }
      
      // Accept the connection via API
      const response = await fetch('/api/connections/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }
      
      // Redirect to dashboard with welcome message
      router.push('/dashboard?welcome=connection')
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      setAccepting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 text-white font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }
  
  if (!connection) {
    return null
  }
  
  // Check if already accepted
  if (connection.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-gray-600 mb-6">
            This invitation has already been accepted. Please log in to access your dashboard.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2.5 text-white font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  // Check if declined
  if (connection.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Declined</h1>
          <p className="text-gray-600 mb-6">
            This invitation was previously declined.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 text-white font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div 
          className="p-8 text-white text-center"
          style={{ 
            background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)'
          }}
        >
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connection Invitation</h1>
          <p className="text-orange-50">
            You've been invited to connect on TradeQuote
          </p>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              You've been invited to join as a subcontractor connection. 
              This is a <strong>free account</strong> that allows you to:
            </p>
            
            <div className="bg-blue-50 rounded-lg p-5 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">View Scheduled Appointments</h3>
                  <p className="text-sm text-gray-600">See when and where you're needed</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Accept or Decline Jobs</h3>
                  <p className="text-sm text-gray-600">Choose which appointments work for you</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Access Job Details</h3>
                  <p className="text-sm text-gray-600">View locations, client info, and job requirements</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Stay Organized</h3>
                  <p className="text-sm text-gray-600">All your appointments in one place</p>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={acceptInvitation}
            disabled={accepting}
            className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.accent.DEFAULT }}
            onMouseEnter={(e) => !accepting && (e.currentTarget.style.backgroundColor = colors.accent.hover)}
            onMouseLeave={(e) => !accepting && (e.currentTarget.style.backgroundColor = colors.accent.DEFAULT)}
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accept Invitation
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            100% free • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AcceptConnectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    }>
      <AcceptConnectionContent />
    </Suspense>
  )
}
