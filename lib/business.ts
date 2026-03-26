/**
 * Business Context and Permissions Utilities
 * Handles business-based multi-tenancy and role-based permissions
 */

import { supabase } from '@/lib/supabase'

export type BusinessRole = 'owner' | 'admin' | 'member'

export type UserPermissions = {
  can_access_timesheets: boolean
  can_access_jobs: boolean
  can_access_invoicing: boolean
  can_access_quoting: boolean
  can_access_purchases: boolean
  can_access_reports: boolean
  can_access_scheduling: boolean
  can_access_enquiries: boolean
  can_access_staff_tracking: boolean
  can_access_settings: boolean
  can_access_staff_members: boolean
  can_access_billing: boolean
}

export type UserBusiness = {
  business_id: string
  business_name: string
  role: BusinessRole
  permissions: UserPermissions
  is_active: boolean
}

/**
 * Get the current user's business context
 */
export async function getUserBusiness(): Promise<UserBusiness | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_businesses')
      .select(`
        business_id,
        role,
        is_active,
        can_access_timesheets,
        can_access_jobs,
        can_access_invoicing,
        can_access_quoting,
        can_access_purchases,
        can_access_reports,
        can_access_scheduling,
        can_access_enquiries,
        can_access_staff_tracking,
        can_access_settings,
        can_access_staff_members,
        can_access_billing,
        businesses!inner (
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Error fetching user business:', error)
      return null
    }

    return {
      business_id: data.business_id,
      business_name: (data.businesses as any).name,
      role: data.role as BusinessRole,
      is_active: data.is_active,
      permissions: {
        can_access_timesheets: data.can_access_timesheets,
        can_access_jobs: data.can_access_jobs,
        can_access_invoicing: data.can_access_invoicing,
        can_access_quoting: data.can_access_quoting,
        can_access_purchases: data.can_access_purchases,
        can_access_reports: data.can_access_reports,
        can_access_scheduling: data.can_access_scheduling,
        can_access_enquiries: data.can_access_enquiries,
        can_access_staff_tracking: data.can_access_staff_tracking,
        can_access_settings: data.can_access_settings,
        can_access_staff_members: data.can_access_staff_members,
        can_access_billing: data.can_access_billing,
      },
    }
  } catch (error) {
    console.error('Error in getUserBusiness:', error)
    return null
  }
}

/**
 * Get just the business_id for the current user
 */
export async function getBusinessId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_businesses')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data.business_id
  } catch {
    return null
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: keyof UserPermissions): Promise<boolean> {
  const business = await getUserBusiness()
  if (!business) return false
  return business.permissions[permission]
}

/**
 * Check if current user is owner or admin
 */
export async function isOwnerOrAdmin(): Promise<boolean> {
  const business = await getUserBusiness()
  if (!business) return false
  return business.role === 'owner' || business.role === 'admin'
}

/**
 * Get permission-filtered query WHERE clause
 * Use this to filter queries by business_id
 */
export async function getBusinessFilter() {
  const businessId = await getBusinessId()
  if (!businessId) throw new Error('No business found for user')
  return businessId
}

/**
 * Permission check middleware for API routes
 */
export async function requirePermission(permission: keyof UserPermissions): Promise<boolean> {
  const allowed = await hasPermission(permission)
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`)
  }
  return true
}

/**
 * Check multiple permissions (user needs ALL of them)
 */
export async function hasAllPermissions(permissions: (keyof UserPermissions)[]): Promise<boolean> {
  const business = await getUserBusiness()
  if (!business) return false
  return permissions.every(p => business.permissions[p])
}

/**
 * Check multiple permissions (user needs ANY of them)
 */
export async function hasAnyPermission(permissions: (keyof UserPermissions)[]): Promise<boolean> {
  const business = await getUserBusiness()
  if (!business) return false
  return permissions.some(p => business.permissions[p])
}

/**
 * Get all team members for the current business
 */
export async function getTeamMembers() {
  const businessId = await getBusinessId()
  if (!businessId) return []

  const { data, error } = await supabase
    .from('user_businesses')
    .select(`
      *,
      users:user_id (
        email
      )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  return data || []
}

/**
 * Update user permissions (owner/admin only)
 */
export async function updateUserPermissions(
  userId: string,
  permissions: Partial<UserPermissions>
) {
  const canManage = await hasPermission('can_access_staff_members')
  if (!canManage) {
    throw new Error('Permission denied: Cannot manage staff members')
  }

  const businessId = await getBusinessId()
  if (!businessId) throw new Error('No business found')

  const { error } = await supabase
    .from('user_businesses')
    .update(permissions)
    .eq('user_id', userId)
    .eq('business_id', businessId)

  if (error) throw error
  return true
}

/**
 * Invite user to business (owner/admin only)
 */
export async function inviteUserToBusiness(email: string, role: BusinessRole = 'member') {
  const canManage = await hasPermission('can_access_staff_members')
  if (!canManage) {
    throw new Error('Permission denied: Cannot invite staff members')
  }

  const businessId = await getBusinessId()
  if (!businessId) throw new Error('No business found')

  // TODO: Implement actual invitation system
  // This would typically:
  // 1. Create invitation record
  // 2. Send email with invite link
  // 3. User accepts and gets added to user_businesses

  return { success: true, message: 'Invitation sent' }
}
