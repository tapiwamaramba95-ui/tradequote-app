'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Smartphone, QrCode, CheckCircle, AlertCircle } from 'lucide-react'
import QRCode from 'qrcode'

export default function SetupTwoFactorPage() {
  const [step, setStep] = useState<'start' | 'enroll' | 'verify' | 'complete'>('start')
  const [factorId, setFactorId] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [uri, setUri] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startEnrollment = async () => {
    setLoading(true)
    setError('')

    try {
      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) {
        setError('Failed to start 2FA setup: ' + error.message)
        setLoading(false)
        return
      }

      console.log('Enrollment started:', data)
      
      setFactorId(data.id)
      setUri(data.totp.uri)

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(data.totp.uri)
      setQrCodeUrl(qrDataUrl)

      setStep('enroll')
      setLoading(false)
    } catch (err) {
      setError('An error occurred: ' + String(err))
      setLoading(false)
    }
  }

  const verifyEnrollment = async () => {
    setLoading(true)
    setError('')

    try {
      // For TOTP enrollment verification, we need to create a challenge first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      })

      if (challengeError) {
        setError('Failed to create challenge: ' + challengeError.message)
        setLoading(false)
        return
      }

      console.log('Challenge created for verification:', challenge)

      // Now verify with the challenge ID
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challenge.id,
        code: verificationCode
      })

      if (error) {
        setError('Invalid verification code. Please try again.')
        setLoading(false)
        return
      }

      console.log('2FA enrollment verified successfully:', data)
      setStep('complete')
      setLoading(false)
    } catch (err) {
      setError('Verification failed: ' + String(err))
      setLoading(false)
    }
  }

  const testMFA = () => {
    window.location.href = '/test-2fa'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {step === 'start' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Secure Your Account
              </h2>
              <p className="text-gray-600 mb-6">
                Add an extra layer of security by enabling two-factor authentication using your phone.
              </p>
              <button
                onClick={startEnrollment}
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Setup 2FA'}
              </button>
            </div>
          )}

          {step === 'enroll' && (
            <div>
              <div className="text-center mb-6">
                <QrCode className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Scan QR Code
                </h2>
                <p className="text-gray-600">
                  Open your authenticator app and scan this QR code.
                </p>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="border rounded-lg p-4 bg-white"
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-600 mb-2">
                  If you can't scan the QR code, enter this code manually:
                </p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded break-all">
                  {uri.split('secret=')[1]?.split('&')[0] || 'Loading...'}
                </code>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter verification code from your app
                  </label>
                  <input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('start')
                      setError('')
                      setQrCodeUrl('')
                      setVerificationCode('')
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyEnrollment}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                2FA Enabled Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={testMFA}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Test 2FA Setup
                </button>
                
                <button
                  onClick={() => window.location.href = '/dashboard/settings'}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}