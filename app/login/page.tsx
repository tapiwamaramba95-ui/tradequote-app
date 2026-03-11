'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
import { Shield, Smartphone } from 'lucide-react'

type LoginStep = 'credentials' | '2fa'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials')
  const [trustDevice, setTrustDevice] = useState(false)

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Check if user has 2FA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors()
      
      if (factors?.totp && factors.totp.length > 0) {
        // User has 2FA - check if device is trusted
        const deviceId = getOrCreateDeviceId()
        const isDeviceTrusted = await checkDeviceTrust(data.user?.id, deviceId)
        
        if (!isDeviceTrusted) {
          setCurrentStep('2fa')
          setLoading(false)
          return
        }
      }

      // No 2FA required or device is trusted - proceed to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleTwoFactorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        setError('2FA is not properly set up')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: totpFactor.challenge_id || '',
        code: totpCode
      })

      if (error) {
        setError('Invalid verification code')
        setLoading(false)
        return
      }

      // If user chose to trust device, save it
      if (trustDevice && data.user) {
        const deviceId = getOrCreateDeviceId()
        await saveTrustedDevice(data.user.id, deviceId)
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Invalid verification code')
      setLoading(false)
    }
  }

  const getOrCreateDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  const checkDeviceTrust = async (userId: string | undefined, deviceId: string): Promise<boolean> => {
    if (!userId) return false
    
    try {
      const { data } = await supabase
        .from('trusted_devices')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single()

      if (data && new Date(data.expires_at) > new Date()) {
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const saveTrustedDevice = async (userId: string, deviceId: string) => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    await supabase.from('trusted_devices').upsert({
      user_id: userId,
      device_id: deviceId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    })
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${colors.accent.DEFAULT} 0%, ${colors.primary.DEFAULT} 100%)` }}
    >
      <div className="max-w-md w-full mx-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2" style={{ letterSpacing: '0.05em' }}>
            TRADEQUOTE
          </h1>
          <p className="text-white/90 text-sm">Professional CRM for Trade Businesses</p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-lg shadow-2xl p-8"
          style={{ backgroundColor: colors.primary.dark }}
        >
          {currentStep === 'credentials' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white text-center">
                  Log in to Your TradeQuote Account
                </h2>
              </div>
              
              <form className="space-y-5" onSubmit={handleCredentialLogin}>
                {error && (
                  <div 
                    className="p-3 rounded-md text-sm"
                    style={{ 
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      color: '#FCA5A5',
                      border: '1px solid rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    {error}
                  </div>
                )}
                
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="block w-full pl-10 pr-3 py-3 rounded-md text-sm transition-colors"
                      style={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.border.DEFAULT}`,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="block w-full pl-10 pr-3 py-3 rounded-md text-sm transition-colors"
                      style={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.border.DEFAULT}`,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                {/* Forgot Password */}
                <div className="text-center">
                  <a href="#" className="text-sm hover:underline" style={{ color: colors.text.muted }}>
                    Forgot username or password?
                  </a>
                </div>

                {/* Sign Up Link */}
                <div className="text-center pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <span className="text-sm text-white/70">No account? </span>
                  <a
                    href="/auth/sign-up"
                    className="text-sm font-bold hover:underline text-white hover:text-orange-300 transition-colors"
                  >
                    Sign up for free
                  </a>
                </div>
              </form>
            </>
          )}

          {currentStep === '2fa' && (
            <>
              <div className="mb-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                     style={{ backgroundColor: colors.accent.DEFAULT + '20' }}>
                  <Shield className="w-8 h-8" style={{ color: colors.accent.DEFAULT }} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-white/70">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              
              <form className="space-y-5" onSubmit={handleTwoFactorLogin}>
                {error && (
                  <div 
                    className="p-3 rounded-md text-sm"
                    style={{ 
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      color: '#FCA5A5',
                      border: '1px solid rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    {error}
                  </div>
                )}
                
                {/* 2FA Code Input */}
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-white/80 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-white/40" />
                    </div>
                    <input
                      id="totpCode"
                      type="text"
                      required
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="block w-full pl-10 pr-3 py-3 rounded-md text-sm transition-colors text-center text-lg font-mono tracking-widest"
                      style={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.border.DEFAULT}`,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                </div>

                {/* Trust Device Option */}
                <div className="flex items-start space-x-3 p-3 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <input
                    id="trustDevice"
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded"
                    style={{ accentColor: colors.accent.DEFAULT }}
                  />
                  <div>
                    <label htmlFor="trustDevice" className="text-sm font-medium text-white cursor-pointer">
                      Trust this device for 30 days
                    </label>
                    <p className="text-xs text-white/60 mt-1">
                      Skip 2FA verification on this device for the next 30 days. Only check this on your personal devices.
                    </p>
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                  }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = colors.accent.hover)}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = colors.accent.DEFAULT)}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => { setCurrentStep('credentials'); setError(''); setTotpCode('') }}
                  className="w-full px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/60 text-xs">
          <p>© 2026 TradeQuote. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}