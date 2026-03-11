'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Smartphone, CheckCircle, XCircle } from 'lucide-react'

export default function TwoFactorTestPage() {
  const [user, setUser] = useState<any>(null)
  const [factors, setFactors] = useState<any[]>([])
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkUserAndMFA()
  }, [])

  const checkUserAndMFA = async () => {
    setLoading(true)
    setError('')

    try {
      // Get current user first (client-side)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Not logged in')
        setLoading(false)
        return
      }

      setUser(user)

      // Use API endpoint to check MFA status
      const response = await fetch('/api/check-mfa')
      const mfaData = await response.json()

      if (!response.ok) {
        setError('Error checking MFA via API: ' + mfaData.error)
        setLoading(false)
        return
      }

      console.log('MFA data from API:', mfaData)

      // Also check directly with client
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      console.log('Direct MFA factors response:', { factorsData, factorsError })

      // Try different ways to access factors
      const clientFactors = factorsData?.totp || factorsData?.factors?.filter(f => f.factor_type === 'totp') || []
      const allClientFactors = factorsData?.factors || []
      
      console.log('Processed client factors:', { 
        clientFactors, 
        allClientFactors,
        originalStructure: factorsData 
      })

      const apiFactors = mfaData.mfa?.factors || []

      setFactors(apiFactors)
      
      // Save debug data for UI display
      setDebugData({
        api: mfaData,
        client: factorsData,
        processed: {
          clientFactors,
          allClientFactors,
          apiFactors
        }
      })

      // Compare results and show debug info
      console.log('Comparison:', {
        clientFactorsCount: clientFactors.length,
        apiFactorsCount: apiFactors.length,
        allClientFactorsCount: allClientFactors.length
      })

    } catch (err) {
      setError('An error occurred: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const testMFAChallenge = async () => {
    if (factors.length === 0) {
      setError('No TOTP factors found')
      return
    }

    try {
      const factor = factors[0]
      console.log('Testing challenge creation for factor:', factor.id)

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id
      })

      if (challengeError) {
        setError('Challenge error: ' + challengeError.message)
        return
      }

      console.log('Challenge created successfully:', challenge)
      alert('Challenge created successfully! Check console for details.')
    } catch (err) {
      setError('Challenge test failed: ' + String(err))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">2FA Test Page</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {user && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Current User</h3>
                <p className="text-sm text-gray-600">Email: {user.email}</p>
                <p className="text-sm text-gray-600">ID: {user.id}</p>
              </div>

              {/* MFA Status */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">MFA Status</h3>
                </div>
                
                {factors.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">2FA Enabled</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <h4 className="font-medium text-gray-900 mb-2">TOTP Factors ({factors.length})</h4>
                      {factors.map((factor, index) => (
                        <div key={factor.id} className="text-sm">
                          <p><strong>Factor {index + 1}:</strong></p>
                          <p>ID: {factor.id}</p>
                          <p>Status: {factor.status}</p>
                          <p>Created: {new Date(factor.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={testMFAChallenge}
                      className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                    >
                      Test MFA Challenge
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700 font-medium">2FA Not Enabled</span>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm mb-3">
                        The settings UI shows "2FA enabled" but no factors are actually enrolled via the API. 
                        You need to complete the proper enrollment process.
                      </p>
                      <a
                        href="/setup-2fa"
                        className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Shield className="w-4 h-4" />
                        Setup 2FA Properly
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Debug Information */}
              <div className="bg-gray-50 rounded p-3 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Debug Information</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Console Logs:</strong> Check browser console for detailed factor data</p>
                  <p><strong>API Response:</strong> {factors.length > 0 ? `${factors.length} factors found` : 'No factors detected'}</p>
                  <p><strong>Note:</strong> If you have 2FA enabled but this shows "Not Enabled", check console logs for structure mismatch</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Use the "Setup 2FA Properly" link above to enroll via API</li>
                  <li>Complete the QR code setup with your authenticator app</li>
                  <li>Refresh this page to see updated MFA status</li>
                  <li>Test MFA challenge creation with the button above</li>
                  <li>Try logging out and back in to test the full 2FA login flow</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={checkUserAndMFA}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Refresh Status
                </button>
                
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Logout & Test Login
                </button>
              </div>

              {/* Raw Debug Data */}
              {debugData && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Raw Debug Data</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700">API Response:</h4>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(debugData.api, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Direct Client Response:</h4>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(debugData.client, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Processed Data:</h4>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(debugData.processed, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Not logged in</p>
              <a
                href="/login"
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}