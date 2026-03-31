'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { colors } from '@/lib/colors'
import { clearStaleState, isRecoverableError } from '@/lib/error-handler'

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
  eventId: string | null
}

export class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode
    fallback?: React.ReactElement
    onReset?: () => void
  },
  ErrorBoundaryState
> {
  constructor(props: { 
    children: React.ReactNode
    fallback?: React.ReactElement
    onReset?: () => void
  }) {
    super(props)
    this.state = { hasError: false, error: null, eventId: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, eventId: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Send error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          },
      },
    })
    
    this.setState({ eventId })
  }
  
  resetErrorBoundary = () => {
    // Clear any stale state that might be causing the error
    clearStaleState()
    
    this.setState({ hasError: false, error: null, eventId: null })
    this.props.onReset?.()
  }

  handleReload = () => {
    clearStaleState()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const recoverable = isRecoverableError(this.state.error)
      const errorMessage = this.state.error?.message?.toLowerCase() || ''
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Determine user-friendly message
      let userMessage = "An unexpected error occurred."
      if (recoverable) {
        if (errorMessage.includes('database') || errorMessage.includes('insert') || 
            errorMessage.includes('update') || errorMessage.includes('delete')) {
          userMessage = "There was an issue saving your data. This is usually temporary. Please try again."
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userMessage = "Connection issue detected. Please check your internet and try again."
        } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
          userMessage = "You don't have permission for this action. Try refreshing the page."
        } else {
          userMessage = "Something went wrong, but don't worry - you can try again without losing your work."
        }
      } else {
        userMessage = "Your session may have expired. Please log in again to continue."
      }
      
      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
              {recoverable ? 'Temporary Issue' : 'Session Expired'}
            </h1>
            
            <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
              {userMessage}
            </p>
            
            <div className="flex flex-col gap-3">
              {recoverable ? (
                <>
                  <button
                    onClick={this.handleReload}
                    className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary.DEFAULT }}
                  >
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.resetErrorBoundary}
                    className="px-6 py-3 rounded-lg border-2 font-semibold hover:bg-gray-50 transition-colors"
                    style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 text-sm font-medium hover:underline"
                    style={{ color: colors.text.secondary }}
                  >
                    Go Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      clearStaleState()
                      window.location.href = '/login'
                    }}
                    className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary.DEFAULT }}
                  >
                    Go to Login
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="px-6 py-3 rounded-lg border-2 font-semibold hover:bg-gray-50 transition-colors"
                    style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                  >
                    Reload Page
                  </button>
                </>
              )}
            </div>
            
            {this.state.eventId && (
              <p className="text-xs text-gray-500 mt-4">
                Error ID: {this.state.eventId}
              </p>
            )}
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Debug Info (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded text-left overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook component that auto-resets ErrorBoundary on route change
export function ErrorBoundaryWithReset({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [key, setKey] = React.useState(0)
  
  React.useEffect(() => {
    // Reset error boundary on route change
    setKey(prev => prev + 1)
  }, [pathname])
  
  return (
    <ErrorBoundary 
      key={key}
      onReset={() => {
        // Force re-render on reset
        setKey(prev => prev + 1)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
