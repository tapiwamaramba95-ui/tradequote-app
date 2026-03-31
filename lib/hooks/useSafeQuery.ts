/**
 * React hooks for safe data fetching with automatic error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { safeQuery } from '@/lib/error-handler'
import * as Sentry from '@sentry/nextjs'

type QueryState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook for safe Supabase queries with automatic error handling
 * 
 * @example
 * const { data, loading, error, refetch } = useSafeQuery(
 *   () => supabase.from('jobs').select('*'),
 *   'Failed to load jobs'
 * )
 */
export function useSafeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage?: string,
  dependencies: any[] = []
): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await safeQuery(queryFn, errorMessage)
      
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      Sentry.captureException(error)
    } finally {
      setLoading(false)
    }
  }, [queryFn, errorMessage])

  useEffect(() => {
    let mounted = true
    
    const runQuery = async () => {
      if (mounted) {
        await fetchData()
      }
    }
    
    runQuery()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

/**
 * Hook for safe async operations with loading state
 * 
 * @example
 * const { execute, loading } = useSafeAsync(
 *   async (jobId) => {
 *     await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)
 *   },
 *   'Failed to update job'
 * )
 */
export function useSafeAsync<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  errorMessage?: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await asyncFn(...args)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      
      // Log to Sentry
      Sentry.captureException(error, {
        contexts: {
          operation: {
            message: errorMessage,
          },
        },
      })

      // Show error toast
      if (errorMessage && typeof window !== 'undefined') {
        const event = new CustomEvent('show-error-toast', {
          detail: { message: errorMessage }
        })
        window.dispatchEvent(event)
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [asyncFn, errorMessage])

  return {
    execute,
    loading,
    error
  }
}

/**
 * Hook to detect and recover from app freeze
 * Adds keyboard shortcut (Ctrl/Cmd + Shift + R) to force recovery
 */
export function useFreezeRecovery() {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + R = Force recovery
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        
        console.log('🔄 Force recovery triggered')
        
        // Clear all state
        sessionStorage.clear()
        
        // Show recovery message
        const confirmed = confirm(
          'Force recovery mode activated.\n\n' +
          'This will:\n' +
          '• Clear all cached data\n' +
          '• Reload the application\n' +
          '• You may need to log in again\n\n' +
          'Continue?'
        )
        
        if (confirmed) {
          window.location.href = '/dashboard'
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    // Log recovery shortcut for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Recovery Mode: Press Ctrl/Cmd + Shift + R to force recovery')
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])
}
