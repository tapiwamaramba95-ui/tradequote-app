/**
 * React hooks for business context and permissions
 */

'use client'

import { useEffect, useState } from 'react'
import { getUserBusiness, hasPermission, getBusinessId, type UserBusiness, type UserPermissions } from '@/lib/business'
import { useRouter } from 'next/navigation'

/**
 * Hook to get current user's business context
 */
export function useBusinessContext() {
  const [business, setBusiness] = useState<UserBusiness | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    try {
      const data = await getUserBusiness()
      setBusiness(data)
    } catch (error) {
      console.error('Error loading business:', error)
    } finally {
      setLoading(false)
    }
  }

  return { business, loading, reload: loadBusiness }
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: keyof UserPermissions) {
  const { business, loading } = useBusinessContext()
  
  return {
    hasPermission: business?.permissions[permission] ?? false,
    loading,
  }
}

/**
 * Hook to check if user is owner or admin
 */
export function useIsOwnerOrAdmin() {
  const { business, loading } = useBusinessContext()
  
  return {
    isOwnerOrAdmin: business?.role === 'owner' || business?.role === 'admin',
    loading,
  }
}

/**
 * Hook to get business_id for queries
 */
export function useBusinessId() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinessId()
  }, [])

  const loadBusinessId = async () => {
    try {
      const id = await getBusinessId()
      setBusinessId(id)
    } catch (error) {
      console.error('Error loading business ID:', error)
    } finally {
      setLoading(false)
    }
  }

  return { businessId, loading }
}

/**
 * Require permission hook - redirects if user doesn't have permission
 */
export function useRequirePermission(permission: keyof UserPermissions, redirectTo: string = '/dashboard') {
  const router = useRouter()
  const { business, loading } = useBusinessContext()

  useEffect(() => {
    if (!loading && business) {
      if (!business.permissions[permission]) {
        router.push(redirectTo)
      }
    }
  }, [business, loading, permission, redirectTo, router])

  return { loading, hasAccess: business?.permissions[permission] ?? false }
}

/**
 * Require owner/admin role - redirects if user is not owner/admin
 */
export function useRequireOwnerOrAdmin(redirectTo: string = '/dashboard') {
  const router = useRouter()
  const { business, loading } = useBusinessContext()

  useEffect(() => {
    if (!loading && business) {
      if (business.role !== 'owner' && business.role !== 'admin') {
        router.push(redirectTo)
      }
    }
  }, [business, loading, redirectTo, router])

  return { loading, isOwnerOrAdmin: business?.role === 'owner' || business?.role === 'admin' }
}
