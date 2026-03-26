import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/business'
import { PermissionKey, StaffPermissions, OWNER_PERMISSIONS } from './types'

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<StaffPermissions | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const businessId = await getBusinessId()
    if (!businessId) return null
    
    // Get staff record with permissions
    const { data: staff, error } = await supabase
      .from('staff')
      .select('permissions, role, is_active')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()
    
    if (error || !staff) {
      console.error('Error loading permissions:', error)
      return null
    }
    
    // If user is owner, return full permissions
    if (staff.role === 'Owner' || staff.role === 'Account Owner') {
      return OWNER_PERMISSIONS
    }
    
    return staff.permissions as StaffPermissions || null
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission: PermissionKey): Promise<boolean> {
  const permissions = await getCurrentUserPermissions()
  if (!permissions) return false
  
  return permissions[permission] === true
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(permissionKeys: PermissionKey[]): Promise<boolean> {
  const permissions = await getCurrentUserPermissions()
  if (!permissions) return false
  
  return permissionKeys.some(key => permissions[key] === true)
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(permissionKeys: PermissionKey[]): Promise<boolean> {
  const permissions = await getCurrentUserPermissions()
  if (!permissions) return false
  
  return permissionKeys.every(key => permissions[key] === true)
}

/**
 * Check if current user is business owner
 */
export async function isBusinessOwner(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const businessId = await getBusinessId()
    if (!businessId) return false
    
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()
    
    return staff?.role === 'Owner' || staff?.role === 'Account Owner'
  } catch (error) {
    return false
  }
}
