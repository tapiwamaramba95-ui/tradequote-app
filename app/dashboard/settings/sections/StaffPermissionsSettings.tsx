'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Info } from 'lucide-react'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'

export type Staff = {
  id: string
  name: string
  email: string
  phone?: string
  mobile?: string
  username?: string
  role?: string
  status?: string
  hourly_cost?: number
  billing_rate?: string
  licence_number?: string
  permissions?: {
    timesheets?: boolean
    jobs?: boolean
    invoicing?: boolean
    quoting?: boolean
    purchases?: boolean
    reports_financials?: boolean
    scheduling_dispatch?: boolean
    enquiries?: boolean
    staff_tracking?: boolean
    settings?: boolean
    staff_members?: boolean
    plan_billing?: boolean
  }
  notifications?: {
    job_alerts_email?: boolean
    job_alerts_mobile?: boolean
    enquiries_email?: boolean
    enquiries_mobile?: boolean
    approval_confirmation_popup?: boolean
    copy_bills_to_costs_popup?: boolean
  }
}

export default function StaffPermissionsSettings() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    email: '',
    username: '',
    mobile: '',
    phone: '',
    role: 'Account Owner',
    billing_rate: 'Standard Labour Rate',
    hourly_cost: 0,
    licence_number: '',
    status: 'active',
    permissions: {
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
      plan_billing: true,
    },
    notifications: {
      job_alerts_email: true,
      job_alerts_mobile: true,
      enquiries_email: true,
      enquiries_mobile: true,
      approval_confirmation_popup: true,
      copy_bills_to_costs_popup: true,
    }
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessId = await getBusinessId()
    if (!businessId) return

    // First, check if user has any staff records
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    
    // If no staff records exist, create one for the account owner
    if (!error && (!data || data.length === 0)) {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const accountOwnerName = profile?.full_name || user.email?.split('@')[0] || 'Account Owner'
      const accountOwnerEmail = profile?.email || user.email || ''

      const { error: insertError } = await supabase
        .from('staff')
        .insert([{
          business_id: businessId,
          name: accountOwnerName,
          email: accountOwnerEmail,
          role: 'Account Owner',
          status: 'active',
          billing_rate: 'Standard Labour Rate',
          permissions: {
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
            plan_billing: true,
          }
        }])

      if (!insertError) {
        // Fetch again after creating
        fetchStaff()
        return
      }
    }
    
    if (!error && data) {
      // Sort to ensure Account Owner appears first
      const sortedData = data.sort((a, b) => {
        if (a.role === 'Account Owner' && b.role !== 'Account Owner') return -1
        if (a.role !== 'Account Owner' && b.role === 'Account Owner') return 1
        return 0
      })
      setStaff(sortedData)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessId = await getBusinessId()
    if (!businessId) return

    if (editingStaff) {
      // Update existing staff - exclude id from update
      const { id, ...updateData } = formData as Staff
      const { error } = await supabase
        .from('staff')
        .update(updateData)
        .eq('id', editingStaff.id)
      
      if (error) {
        console.error('Error updating staff:', error)
        alert(`Failed to update staff: ${error.message || JSON.stringify(error)}`)
        return
      }
    } else {
      // Create new staff
      const { error } = await supabase
        .from('staff')
        .insert([{ ...formData, business_id: businessId }])
      
      if (error) {
        console.error('Error creating staff:', error)
        alert(`Failed to create staff: ${error.message || JSON.stringify(error)}`)
        return
      }
    }

    setShowModal(false)
    setEditingStaff(null)
    setFormData({
      name: '',
      email: '',
      username: '',
      mobile: '',
      phone: '',
      role: 'Account Owner',
      billing_rate: 'Standard Labour Rate',
      hourly_cost: 0,
      licence_number: '',
      status: 'active',
      permissions: {},
      notifications: {}
    })
    fetchStaff()
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData(member)
    setShowModal(true)
  }

  const handleToggleStatus = async (member: Staff) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('staff')
      .update({ status: newStatus })
      .eq('id', member.id)
    
    if (!error) fetchStaff()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredStaff = staff.filter(s => s.status === activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} style={{ color: colors.accent.DEFAULT }} />
          <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>
            Staff & Permissions
          </h1>
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Manage staff member information, user permissions and access to Tradify. Adding pay rates to staff members will enable more accurate job cost reporting.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border p-4 mb-6" style={{ backgroundColor: `${colors.accent.DEFAULT}10`, borderColor: `${colors.accent.DEFAULT}30` }}>
        <div className="flex items-start gap-3">
          <Info size={20} style={{ color: colors.accent.DEFAULT }} className="mt-0.5" />
          <p className="text-sm" style={{ color: colors.text.primary }}>
            During your trial there is no limit on the number of staff members you can create.
          </p>
        </div>
      </div>

      {/* New Staff Button */}
      <button
        onClick={() => {
          setEditingStaff(null)
          setFormData({
            name: '',
            email: '',
            username: '',
            mobile: '',
            phone: '',
            role: 'Account Owner',
            billing_rate: 'Standard Labour Rate',
            hourly_cost: 0,
            licence_number: '',
            status: 'active',
            permissions: {
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
              plan_billing: true,
            },
            notifications: {
              job_alerts_email: true,
              job_alerts_mobile: true,
              enquiries_email: true,
              enquiries_mobile: true,
              approval_confirmation_popup: true,
              copy_bills_to_costs_popup: true,
            }
          })
          setShowModal(true)
        }}
        className="mb-6 inline-flex items-center rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        New Staff Member
      </button>

      {/* Tabs */}
      <div className="bg-white border-b mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('active')}
            className="px-4 py-3 text-sm font-medium border-b-2 border-transparent"
            style={{
              borderBottomColor: activeTab === 'active' ? colors.accent.DEFAULT : 'transparent',
              color: activeTab === 'active' ? colors.accent.DEFAULT : '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'active') {
                (e.target as HTMLElement).style.color = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'active') {
                (e.target as HTMLElement).style.color = '#6b7280'
              }
            }}
          >
            Active ({staff.filter(s => s.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className="px-4 py-3 text-sm font-medium border-b-2 border-transparent"
            style={{
              borderBottomColor: activeTab === 'inactive' ? colors.accent.DEFAULT : 'transparent',
              color: activeTab === 'inactive' ? colors.accent.DEFAULT : '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'inactive') {
                (e.target as HTMLElement).style.color = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'inactive') {
                (e.target as HTMLElement).style.color = '#6b7280'
              }
            }}
          >
            Inactive ({staff.filter(s => s.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Role</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400 border-b">
                    No {activeTab} staff members yet.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 border-b cursor-pointer"
                    onClick={() => handleEdit(member)}
                  >
                    <td className="px-4 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(member.name)}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-2">
                        {member.role || '-'}
                        {member.role === 'Account Owner' && (
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(member)
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          member.status === 'active' ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            member.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-gray-900/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-8 py-6 z-10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-2xl">
                  {formData.name ? getInitials(formData.name) : 'TM'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formData.name || 'New Staff Member'}
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-8 py-6">
                {/* Tabs */}
                <div className="border-b mb-6">
                  <div className="flex gap-6">
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 font-medium text-sm"
                      style={{ borderBottomColor: colors.accent.DEFAULT, color: colors.accent.DEFAULT }}
                    >
                      Personal Information
                    </button>
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm"
                    >
                      Staff Permissions
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username || formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <button type="button" className="hover:underline" style={{ color: colors.accent.DEFAULT }}>
                          Learn about changing usernames.
                        </button>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                      <input
                        type="text"
                        value={formData.mobile || ''}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Billing Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.billing_rate || 'Standard Labour Rate'}
                          onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Cost <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourly_cost || ''}
                        onChange={(e) => setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Licence Number <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.licence_number || ''}
                        onChange={(e) => setFormData({ ...formData, licence_number: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* External Calendars */}
                    <div className="pt-6 border-t">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">External Calendars</h3>
                      <button
                        type="button"
                        className="w-full font-semibold py-2.5 px-4 rounded text-sm text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: colors.accent.DEFAULT }}
                      >
                        Connect Google Calendar
                      </button>
                    </div>

                    {/* Notifications */}
                    <div className="pt-6 border-t">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Notifications</h3>
                      
                      <div className="space-y-4">
                        {/* Job and To-Do Alerts */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-700">Job and To-Do Alerts</span>
                            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="space-y-2 ml-4">
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    job_alerts_email: !formData.notifications?.job_alerts_email
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.job_alerts_email ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.job_alerts_email ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Email</span>
                            </label>
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    job_alerts_mobile: !formData.notifications?.job_alerts_mobile
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.job_alerts_mobile ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.job_alerts_mobile ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Mobile App</span>
                            </label>
                          </div>
                        </div>

                        {/* Enquiries */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-700">Enquiries</span>
                            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="space-y-2 ml-4">
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    enquiries_email: !formData.notifications?.enquiries_email
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.enquiries_email ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.enquiries_email ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Email</span>
                            </label>
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    enquiries_mobile: !formData.notifications?.enquiries_mobile
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.enquiries_mobile ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.enquiries_mobile ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Mobile App</span>
                            </label>
                          </div>
                        </div>

                        {/* Confirmations */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-700">Confirmations</span>
                          </div>
                          <div className="space-y-2 ml-4">
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    approval_confirmation_popup: !formData.notifications?.approval_confirmation_popup
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.approval_confirmation_popup ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.approval_confirmation_popup ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Approval confirmation pop-up</span>
                                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </label>
                            <label className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  notifications: {
                                    ...formData.notifications,
                                    copy_bills_to_costs_popup: !formData.notifications?.copy_bills_to_costs_popup
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.notifications?.copy_bills_to_costs_popup ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications?.copy_bills_to_costs_popup ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Copy bills to costs pop-up</span>
                                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Staff Permissions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Staff Permissions</h3>
                    
                    <div className="space-y-3">
                      {[
                        { key: 'timesheets', label: 'Timesheets' },
                        { key: 'jobs', label: 'Jobs' },
                        { key: 'invoicing', label: 'Invoicing' },
                        { key: 'quoting', label: 'Quoting' },
                        { key: 'purchases', label: 'Purchases' },
                        { key: 'reports_financials', label: 'Reports & Financials' },
                        { key: 'scheduling_dispatch', label: 'Scheduling & Dispatch' },
                        { key: 'enquiries', label: 'Enquiries' },
                        { key: 'staff_tracking', label: 'Staff Tracking' },
                        { key: 'settings', label: 'Settings' },
                        { key: 'staff_members', label: 'Staff Members' },
                        { key: 'plan_billing', label: 'Plan & Billing' },
                      ].map((permission) => (
                        <label
                          key={permission.key}
                          className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions?.[permission.key as keyof typeof formData.permissions] || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  [permission.key]: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="flex-1 text-sm text-gray-700">
                            {permission.label}
                          </span>
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">No Access</span> - This staff member has no permissions enabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-8 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingStaff(null)
                  }}
                  className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
