/**
 * Staff Permissions Management Component
 * Allows owners/admins to manage team member permissions
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, updateUserPermissions } from '@/lib/business'
import { useRequirePermission } from '@/lib/hooks/useBusiness'
import { Info } from 'lucide-react'

type TeamMember = {
  id: string
  user_id: string
  email: string
  role: 'owner' | 'admin' | 'member'
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

const PERMISSIONS = [
  { key: 'can_access_timesheets', label: 'Timesheets' },
  { key: 'can_access_jobs', label: 'Jobs' },
  { key: 'can_access_invoicing', label: 'Invoicing' },
  { key: 'can_access_quoting', label: 'Quoting' },
  { key: 'can_access_purchases', label: 'Purchases' },
  { key: 'can_access_reports', label: 'Reports & Financials' },
  { key: 'can_access_scheduling', label: 'Scheduling & Dispatch' },
  { key: 'can_access_enquiries', label: 'Enquiries' },
  { key: 'can_access_staff_tracking', label: 'Staff Tracking' },
  { key: 'can_access_settings', label: 'Settings' },
  { key: 'can_access_staff_members', label: 'Staff Members' },
  { key: 'can_access_billing', label: 'Plan & Billing' },
]

export default function StaffPermissionsPage() {
  // Require staff_members permission to access this page
  const { loading: checkingPermission } = useRequirePermission('can_access_staff_members')
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data, error } = await supabase
        .from('user_businesses')
        .select(`
          id,
          user_id,
          role,
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
          can_access_billing
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get user emails from auth.users (you may need a separate query or stored field)
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          // In production, you'd fetch email from auth.users or store it in user_businesses
          return {
            ...member,
            email: `user-${member.user_id.slice(0, 8)}@example.com`, // Placeholder
          }
        })
      )

      setTeamMembers(membersWithEmails)
      if (membersWithEmails.length > 0) {
        setSelectedMember(membersWithEmails[0])
      }
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (permissionKey: string) => {
    if (!selectedMember) return

    const newValue = !selectedMember[permissionKey as keyof TeamMember]
    
    // Optimistic update
    setSelectedMember({
      ...selectedMember,
      [permissionKey]: newValue,
    })

    // Update in database
    try {
      setSaving(true)
      await updateUserPermissions(selectedMember.user_id, {
        [permissionKey]: newValue,
      } as any)

      // Update in local state
      setTeamMembers(members =>
        members.map(m =>
          m.id === selectedMember.id
            ? { ...m, [permissionKey]: newValue }
            : m
        )
      )
    } catch (error) {
      console.error('Error updating permission:', error)
      // Revert optimistic update
      setSelectedMember({
        ...selectedMember,
        [permissionKey]: !newValue,
      })
    } finally {
      setSaving(false)
    }
  }

  if (checkingPermission || loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff Permissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Team Members</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedMember?.id === member.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{member.email}</div>
                  <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="md:col-span-2">
          {selectedMember ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Staff Permissions</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Managing permissions for {selectedMember.email}
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {PERMISSIONS.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-center justify-between"
                    >
                      <label
                        htmlFor={permission.key}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          id={permission.key}
                          checked={selectedMember[permission.key as keyof TeamMember] as boolean}
                          onChange={() => togglePermission(permission.key)}
                          disabled={saving || selectedMember.role === 'owner'}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {permission.label}
                        </span>
                      </label>

                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="More info"
                      >
                        <Info className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>

                {selectedMember.role === 'owner' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Owner</strong> accounts have all permissions enabled by default and cannot be modified.
                    </p>
                  </div>
                )}

                {saving && (
                  <div className="mt-4 text-sm text-gray-500">
                    Saving changes...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <p className="text-gray-500">Select a team member to manage their permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
