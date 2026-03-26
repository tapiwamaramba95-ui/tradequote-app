'use client'

import { ReactNode, useEffect, useState } from 'react'
import { hasPermission, hasAnyPermission, isBusinessOwner } from '@/lib/permissions/check'
import { PermissionKey } from '@/lib/permissions/types'
import { useRouter } from 'next/navigation'

type PermissionGuardProps = {
  children: ReactNode
  permission?: PermissionKey
  anyOf?: PermissionKey[]
  fallback?: ReactNode
  redirectTo?: string
}

export function PermissionGuard({ 
  children, 
  permission, 
  anyOf,
  fallback,
  redirectTo = '/dashboard/access-denied'
}: PermissionGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    async function checkPermissions() {
      try {
        // Check if user is business owner first (they have all permissions)
        const isOwner = await isBusinessOwner()
        if (isOwner) {
          setIsAuthorized(true)
          return
        }
        
        // Check specific permission
        if (permission) {
          const hasAccess = await hasPermission(permission)
          setIsAuthorized(hasAccess)
          return
        }
        
        // Check if user has any of the specified permissions
        if (anyOf && anyOf.length > 0) {
          const hasAnyAccess = await hasAnyPermission(anyOf)
          setIsAuthorized(hasAnyAccess)
          return
        }
        
        // No permission check specified, allow access
        setIsAuthorized(true)
      } catch (error) {
        console.error('Permission check failed:', error)
        setIsAuthorized(false)
      }
    }
    
    checkPermissions()
  }, [permission, anyOf])
  
  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verifying permissions...</p>
        </div>
      </div>
    )
  }
  
  // Access denied
  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  // Authorized - render children
  return <>{children}</>
}
