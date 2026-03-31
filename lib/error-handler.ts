/**
 * Global error handler for unhandled promise rejections and errors
 * This prevents the app from freezing when database errors or other issues occur
 */

import * as Sentry from '@sentry/nextjs'

// Track if handlers are already installed to prevent duplicates
let handlersInstalled = false

/**
 * Install global error handlers
 * Call this once at app startup
 */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined' || handlersInstalled) {
    return
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Log to Sentry
    Sentry.captureException(event.reason, {
      tags: {
        type: 'unhandled_rejection',
      },
    })

    // Prevent default behavior (which would crash the app)
    event.preventDefault()

    // Show user-friendly error message
    const errorMessage = event.reason?.message || 'An unexpected error occurred'
    
    // Only show toast if it's not an auth error (those are handled elsewhere)
    if (!errorMessage.includes('auth') && !errorMessage.includes('session')) {
      showErrorToast(errorMessage)
    }
  })

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error)
    
    // Log to Sentry
    Sentry.captureException(event.error, {
      tags: {
        type: 'uncaught_error',
      },
    })

    // Don't prevent default - let ErrorBoundary catch it
  })

  handlersInstalled = true
  console.log('✓ Global error handlers installed')
}

/**
 * Show error toast notification
 */
function showErrorToast(message: string) {
  // Check if toast system is available
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-error-toast', {
      detail: { message }
    })
    window.dispatchEvent(event)
  }
}

/**
 * Safely handle async operations with automatic error logging
 * Usage: await safeAsync(() => myAsyncFunction())
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallbackValue?: T,
  errorMessage?: string
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error)
    
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        operation: {
          message: errorMessage,
        },
      },
    })

    // Show user-friendly message
    if (errorMessage) {
      showErrorToast(errorMessage)
    }

    return fallbackValue
  }
}

/**
 * Wrap Supabase queries with automatic error handling
 * Usage: const data = await safeQuery(() => supabase.from('table').select())
 */
export async function safeQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  errorMessage?: string
): Promise<T | null> {
  try {
    const { data, error } = await query()
    
    if (error) {
      console.error('Supabase query error:', error)
      
      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          type: 'supabase_error',
        },
        contexts: {
          supabase: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        },
      })

      // Show user-friendly message
      if (errorMessage) {
        showErrorToast(errorMessage)
      }

      return null
    }

    return data
  } catch (error) {
    console.error('Query execution failed:', error)
    Sentry.captureException(error)
    
    if (errorMessage) {
      showErrorToast(errorMessage)
    }
    
    return null
  }
}

/**
 * Clear stale application state
 * Use this when recovering from errors
 */
export function clearStaleState() {
  if (typeof window === 'undefined') return

  try {
    // Clear session storage (temporary data)
    sessionStorage.clear()
    
    // Keep localStorage (user preferences) but clear specific keys
    const keysToRemove = [
      'supabase.auth.token',
      'cached-data',
      'temp-state'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    console.log('✓ Stale state cleared')
  } catch (error) {
    console.error('Failed to clear stale state:', error)
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code?.toLowerCase() || ''
  
  // Auth errors need re-login
  if (errorMessage.includes('auth') || errorMessage.includes('session') || 
      errorMessage.includes('jwt') || errorMessage.includes('token')) {
    return false
  }
  
  // Network errors are usually recoverable with retry
  if (errorMessage.includes('network') || errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') || errorCode.includes('enetunreach')) {
    return true
  }
  
  // Database errors are recoverable (user can fix data and retry)
  if (errorMessage.includes('database') || errorMessage.includes('postgres') ||
      errorMessage.includes('supabase') || errorCode.includes('23')) {
    return true
  }
  
  // Permission/RLS errors are recoverable (might be temporary)
  if (errorMessage.includes('permission') || errorMessage.includes('policy') ||
      errorCode === '42501') {
    return true
  }
  
  // Constraint violations need user to fix input
  if (errorMessage.includes('constraint') || errorMessage.includes('unique') ||
      errorMessage.includes('duplicate') || errorCode === '23505') {
    return true // User can fix and retry
  }
  
  // Most other errors can be retried
  return true
}
