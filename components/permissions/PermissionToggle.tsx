'use client'

import { PermissionKey, PERMISSION_DEFINITIONS, StaffPermissions } from '@/lib/permissions/types'
import { colors } from '@/lib/colors'

type PermissionToggleProps = {
  staffMemberId: string
  staffName: string
  permissions: StaffPermissions
  onChange: (permissions: StaffPermissions) => void
  isLoading?: boolean
}

export function PermissionToggle({ 
  staffMemberId, 
  staffName,
  permissions, 
  onChange,
  isLoading = false
}: PermissionToggleProps) {
  
  const handleToggle = (key: PermissionKey, enabled: boolean) => {
    onChange({
      ...permissions,
      [key]: enabled
    })
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{staffName}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure what this staff member can access
        </p>
      </div>
      
      <div className="space-y-3">
        {PERMISSION_DEFINITIONS.map(permission => (
          <div 
            key={permission.key}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex-1">
              <label 
                htmlFor={`${staffMemberId}-${permission.key}`}
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                {permission.label}
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                {permission.description}
              </p>
            </div>
            
            <button
              id={`${staffMemberId}-${permission.key}`}
              type="button"
              role="switch"
              aria-checked={permissions[permission.key]}
              disabled={isLoading}
              onClick={() => handleToggle(permission.key, !permissions[permission.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                permissions[permission.key] 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200'
              }`}
              style={permissions[permission.key] ? { backgroundColor: colors.accent.DEFAULT } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permissions[permission.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Saving permissions...
        </div>
      )}
    </div>
  )
}
