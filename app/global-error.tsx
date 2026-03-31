'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { colors } from '@/lib/colors'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en-AU">
      <body>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
              Application Error
            </h1>
            
            <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
              Something went wrong. The application has been reset. Please try again.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Clear any stale state
                  if (typeof window !== 'undefined') {
                    sessionStorage.clear()
                  }
                  reset()
                }}
                className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.DEFAULT }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/login'
                }}
                className="px-6 py-3 rounded-lg border-2 font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                Go to Login
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:underline">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-40">
                  {error.message}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
