'use client'

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import QRCode from 'qrcode'

type SecurityLog = {
  id: string
  event_type: string
  ip_address: string
  created_at: string
}

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [uri, setUri] = useState('')
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [mfaEnabled, setMfaEnabled] = useState(false)

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (!factorsError && factors) {
        const totpFactors = factors.totp || []
        setMfaFactors(totpFactors)
        setMfaEnabled(totpFactors.length > 0)
      }

      const { data: logsData } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsData) setSecurityLogs(logsData)

    } catch (error) {
      console.error('Error loading security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('security_audit_log').insert({
          user_id: user.id,
          event_type: 'password_changed',
          ip_address: '',
        })
      }

      alert('Password updated successfully!')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      loadSecurityData()

    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password')
    }
  }

  const handleEnable2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) {
        alert('Failed to start 2FA setup: ' + error.message)
        return
      }
      
      setFactorId(data.id)
      setUri(data.totp.uri)

      const qrUrl = await QRCode.toDataURL(data.totp.uri)
      setQrCodeUrl(qrUrl)

      setShow2FASetup(true)

    } catch (error) {
      alert('Failed to set up 2FA: ' + String(error))
    }
  }

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a 6-digit code')
      return
    }

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      })

      if (challengeError) {
        alert('Failed to create challenge: ' + challengeError.message)
        return
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challenge.id,
        code: verificationCode
      })

      if (error) {
        alert('Invalid verification code. Please try again.')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('security_audit_log').insert({
          user_id: user.id,
          event_type: '2fa_enabled',
        })
      }

      alert('2FA enabled successfully!')
      setShow2FASetup(false)
      setVerificationCode('')
      setFactorId('')
      setUri('')
      setQrCodeUrl('')
      loadSecurityData()

    } catch (error) {
      alert('Failed to verify code: ' + String(error))
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return
    }

    try {
      for (const factor of mfaFactors) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        })
        
        if (error) throw error
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('security_audit_log').insert({
          user_id: user.id,
          event_type: '2fa_disabled',
        })
      }

      alert('2FA disabled successfully')
      loadSecurityData()

    } catch (error) {
      alert('Failed to disable 2FA: ' + String(error))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: colors.text.primary }}>
        Security
      </h1>

      <div className="space-y-6">
        {/* Password Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                Password
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                Manage your account password
              </p>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
              {passwordError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg"
                    style={{ borderColor: colors.border.DEFAULT }}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg"
                    style={{ borderColor: colors.border.DEFAULT }}
                    placeholder="••••••••"
                  />
                  <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg"
                    style={{ borderColor: colors.border.DEFAULT }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="px-4 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: colors.text.primary }}>
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center gap-3">
              {mfaEnabled ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                  Disabled
                </span>
              )}
            </div>
          </div>

          {!mfaEnabled && !show2FASetup && (
            <div>
              <p className="mb-6" style={{ color: colors.text.secondary }}>
                Protect your account with 2FA using an authenticator app like Google Authenticator or Authy.
              </p>
              <button
                onClick={handleEnable2FA}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Enable 2FA
              </button>
            </div>
          )}

          {show2FASetup && (
            <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
                  Step 1: Scan QR Code
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                  Scan this QR code with your authenticator app
                </p>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="mb-4" />
                )}
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs font-medium mb-2" style={{ color: colors.text.primary }}>Manual Entry Secret:</p>
                  <p className="text-xs font-mono break-all" style={{ color: colors.text.primary }}>
                    {uri.split('secret=')[1]?.split('&')[0] || 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
                  Step 2: Enter Verification Code
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                  Enter the 6-digit code from your authenticator app
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-mono tracking-widest"
                  style={{ borderColor: colors.border.DEFAULT }}
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShow2FASetup(false)
                    setVerificationCode('')
                    setFactorId('')
                    setUri('')
                    setQrCodeUrl('')
                  }}
                  className="px-4 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify2FA}
                  disabled={verificationCode.length !== 6}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Verify & Enable
                </button>
              </div>
            </div>
          )}

          {mfaEnabled && (
            <div>
              <p className="mb-6" style={{ color: colors.text.secondary }}>
                2FA is currently enabled on your account. Use your authenticator app to sign in.
              </p>
              
              <button
                onClick={handleDisable2FA}
                className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </div>

        {/* Security Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Recent Security Activity
          </h2>

          {securityLogs.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.text.secondary }}>
              <p>No security activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: colors.text.primary }}>
                      {log.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {new Date(log.created_at).toLocaleString('en-AU')}
                      {log.ip_address && ` • ${log.ip_address}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
