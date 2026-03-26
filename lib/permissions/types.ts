// Staff Permission Types and Definitions

export type PermissionKey = 
  | 'timesheets'
  | 'jobs'
  | 'invoicing'
  | 'quoting'
  | 'purchases'
  | 'reports_financials'
  | 'scheduling_dispatch'
  | 'enquiries'
  | 'staff_tracking'
  | 'settings'
  | 'staff_members'
  | 'plan_billing'

export type StaffPermissions = {
  [K in PermissionKey]: boolean
}

export interface PermissionDefinition {
  key: PermissionKey
  label: string
  description: string
  icon?: string
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'timesheets',
    label: 'Timesheets',
    description: 'View and manage timesheets'
  },
  {
    key: 'jobs',
    label: 'Jobs',
    description: 'View and manage jobs'
  },
  {
    key: 'invoicing',
    label: 'Invoicing',
    description: 'Create and manage invoices'
  },
  {
    key: 'quoting',
    label: 'Quoting',
    description: 'Create and manage quotes'
  },
  {
    key: 'purchases',
    label: 'Purchases',
    description: 'View and create purchase orders'
  },
  {
    key: 'reports_financials',
    label: 'Reports & Financials',
    description: 'View financial reports and analytics'
  },
  {
    key: 'scheduling_dispatch',
    label: 'Scheduling & Dispatch',
    description: 'Schedule jobs and dispatch staff'
  },
  {
    key: 'enquiries',
    label: 'Enquiries',
    description: 'View and manage customer enquiries'
  },
  {
    key: 'staff_tracking',
    label: 'Staff Tracking',
    description: 'Track staff location and time'
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Access system settings'
  },
  {
    key: 'staff_members',
    label: 'Staff Members',
    description: 'Manage staff members and permissions'
  },
  {
    key: 'plan_billing',
    label: 'Plan & Billing',
    description: 'Manage subscription and billing'
  }
]

// Default permissions for new staff members (basic access)
export const DEFAULT_PERMISSIONS: StaffPermissions = {
  timesheets: true,
  jobs: true,
  invoicing: false,
  quoting: false,
  purchases: false,
  reports_financials: false,
  scheduling_dispatch: true,
  enquiries: true,
  staff_tracking: false,
  settings: false,
  staff_members: false,
  plan_billing: false
}

// Owner permissions (full access)
export const OWNER_PERMISSIONS: StaffPermissions = {
  timesheets: true,
  jobs: true,
  invoicing: true,
  quoting: true,
  purchases: true,
  reports_financials: true,
  scheduling_dispatch: true,
  enquiries: true,
  staff_tracking: true,
  settings: true,
  staff_members: true,
  plan_billing: true
}
