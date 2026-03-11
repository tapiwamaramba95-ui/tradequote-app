'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white text-center">
              Log in to Your TradeQuote Account
            </h2>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
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
                  placeholder="Username"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded"
                style={{
                  accentColor: colors.accent.DEFAULT
                }}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-white/80">
                Keep me logged in on this computer
              </label>
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
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/60 text-xs">
          <p>© 2026 TradeQuote. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}