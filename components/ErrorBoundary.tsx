'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { colors } from '@/lib/colors'

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
    this.setState({ hasError: false, error: null, eventId: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
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
              Something went wrong
            </h1>
            
            <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
              We've been notified and are working on a fix. Try refreshing the page or navigating elsewhere.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
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
