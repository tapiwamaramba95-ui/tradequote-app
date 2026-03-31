'use client'

import { useEffect } from 'react'
import { installGlobalErrorHandlers } from '@/lib/error-handler'

/**
 * Component that installs global error handlers on mount
 * Place this at the root of your app to catch all unhandled errors
 */
export function GlobalErrorHandlerInstaller() {
  useEffect(() => {
    installGlobalErrorHandlers()
  }, [])

  return null
}
