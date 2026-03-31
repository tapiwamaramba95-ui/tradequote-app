'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { Clock, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react'
import { getBusinessId } from '@/lib/business'
import { useToast } from '@/components/Toast'
import { isBusinessOwner } from '@/lib/permissions/check'
import { useRouter } from 'next/navigation'

interface StaffMember {
  id: string
  user_id: string
  name: string
  email?: string
  hourly_rate: number
  is_active: boolean
}

interface TimesheetEntry {
  id: string
  user_id: string
  staff_id: string
  job_id: string
  date: string
  start_time: string
  end_time: string
  hours: number
  hourly_rate: number
  description: string | null
  is_billable: boolean
  jobs?: {
    job_name: string
    job_number: string
  }
}

export default function StaffHoursPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7) // Default to last 7 days
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    job_id: '',
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    is_billable: true
  })
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    checkPermissionAndLoadData()
  }, [])

  useEffect(() => {
    if (selectedStaffId && hasPermission) {
      loadTimesheets()
    }
  }, [selectedStaffId, startDate, endDate])

  const checkPermissionAndLoadData = async () => {
    try {
      const isOwner = await isBusinessOwner()
      
      if (!isOwner) {
        toast('error', 'You do not have permission to access this page')
        router.push('/dashboard')
        return
      }

      setHasPermission(true)
      await Promise.all([loadStaff(), loadJobs()])
    } catch (error) {
      console.error('Error checking permissions:', error)
      toast('error', 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data, error } = await supabase
        .from('staff')
        .select('id, user_id, name, email, hourly_rate, is_active')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setStaff(data || [])

      // Auto-select first staff member
      if (data && data.length > 0 && !selectedStaffId) {
        setSelectedStaffId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
      toast('error', 'Failed to load staff members')
    }
  }

  const loadJobs = async () => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_name, job_number, status')
        .eq('business_id', businessId)
        .in('status', ['scheduled', 'in_progress', 'completed'])
        .order('job_number', { ascending: false })
        .limit(100)

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const loadTimesheets = async () => {
    try {
      if (!selectedStaffId) return

      const { data, error } = await supabase
        .from('timesheets')
        .select('*, jobs(job_name, job_number)')
        .eq('staff_id', selectedStaffId)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('end_time', 'is', null)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      setTimesheets(data || [])
    } catch (error) {
      console.error('Error loading timesheets:', error)
      toast('error', 'Failed to load timesheet data')
    }
  }

  const handleEdit = (entry: TimesheetEntry) => {
    setEditingEntry(entry)
    setFormData({
      job_id: entry.job_id,
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      description: entry.description || '',
      is_billable: entry.is_billable
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timesheet entry?')) return

    try {
      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast('success', 'Timesheet entry deleted successfully')
      loadTimesheets()
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast('error', 'Failed to delete timesheet entry')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const selectedStaff = staff.find(s => s.id === selectedStaffId)
      if (!selectedStaff) {
        toast('error', 'Please select a staff member')
        return
      }

      // Calculate hours
      const start = new Date(`${formData.date}T${formData.start_time}`)
      const end = new Date(`${formData.date}T${formData.end_time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

      if (hours <= 0) {
        toast('error', 'End time must be after start time')
        return
      }

      const businessId = await getBusinessId()
      const { data: { user } } = await supabase.auth.getUser()

      const timesheetData = {
        user_id: selectedStaff.user_id,
        staff_id: selectedStaffId,
        job_id: formData.job_id,
        business_id: businessId,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        hours: parseFloat(hours.toFixed(2)),
        hourly_rate: selectedStaff.hourly_rate || 0,
        description: formData.description || null,
        is_billable: formData.is_billable
      }

      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('timesheets')
          .update(timesheetData)
          .eq('id', editingEntry.id)

        if (error) throw error
        toast('success', 'Timesheet entry updated successfully')
      } else {
        // Create new entry
        const { error } = await supabase
          .from('timesheets')
          .insert(timesheetData)

        if (error) throw error
        toast('success', 'Timesheet entry added successfully')
      }

      setShowEditModal(false)
      setShowAddModal(false)
      setEditingEntry(null)
      resetForm()
      loadTimesheets()
    } catch (error) {
      console.error('Error saving entry:', error)
      toast('error', 'Failed to save timesheet entry')
    }
  }

  const resetForm = () => {
    setFormData({
      job_id: '',
      date: '',
      start_time: '',
      end_time: '',
      description: '',
      is_billable: true
    })
  }

  const handleAddNew = () => {
    setEditingEntry(null)
    resetForm()
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }))
    setShowAddModal(true)
  }

  const formatTime12Hour = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalHours = () => {
    return timesheets.reduce((sum, entry) => sum + entry.hours, 0)
  }

  const getTotalCost = () => {
    return timesheets.reduce((sum, entry) => sum + (entry.hours * entry.hourly_rate), 0)
  }

  const adjustDateRange = (days: number) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setDate(start.getDate() + days)
    end.setDate(end.getDate() + days)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const setQuickRange = (range: 'week' | 'month' | 'all') => {
    const end = new Date()
    const start = new Date()

    if (range === 'week') {
      start.setDate(end.getDate() - 7)
    } else if (range === 'month') {
      start.setMonth(end.getMonth() - 1)
    } else {
      start.setFullYear(end.getFullYear() - 1)
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent.DEFAULT }}></div>
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: colors.background.card }}>
                <Clock className="h-8 w-8" style={{ color: colors.accent.DEFAULT }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  Staff Hours Management
                </h1>
                <p style={{ color: colors.text.secondary }}>
                  View, add, and edit timesheet entries for all staff members
                </p>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              disabled={!selectedStaffId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.accent.DEFAULT,
                color: 'white'
              }}
            >
              <Plus className="h-5 w-5" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: colors.background.card }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                <Users className="h-4 w-4 inline mr-1" />
                Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: colors.background.main,
                  color: colors.text.primary,
                  borderColor: colors.border,
                  '--tw-ring-color': colors.accent.DEFAULT
                } as any}
              >
                <option value="">Select a staff member</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.email ? `(${member.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    '--tw-ring-color': colors.accent.DEFAULT
                  } as any}
                />
                <span style={{ color: colors.text.secondary }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    '--tw-ring-color': colors.accent.DEFAULT
                  } as any}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setQuickRange('week')}
                  className="px-3 py-1 text-xs rounded-md transition-colors"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickRange('month')}
                  className="px-3 py-1 text-xs rounded-md transition-colors"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  Last Month
                </button>
                <button
                  onClick={() => setQuickRange('all')}
                  className="px-3 py-1 text-xs rounded-md transition-colors"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  Last Year
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {selectedStaffId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Total Hours
                  </p>
                  <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                    {getTotalHours().toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: colors.background.main }}>
                  <Clock className="h-8 w-8" style={{ color: colors.accent.DEFAULT }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Total Cost
                  </p>
                  <p className="text-3xl font-bold" style={{ color: colors.semantic.success }}>
                    ${getTotalCost().toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: colors.background.main }}>
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timesheets Table */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.background.card }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Timesheet Entries
            </h2>
          </div>

          {!selectedStaffId ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4" style={{ color: colors.text.muted }} />
              <p className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                Select a Staff Member
              </p>
              <p style={{ color: colors.text.secondary }}>
                Choose a staff member from the dropdown above to view their timesheet entries
              </p>
            </div>
          ) : timesheets.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4" style={{ color: colors.text.muted }} />
              <p className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                No Entries Found
              </p>
              <p style={{ color: colors.text.secondary }}>
                No timesheet entries found for the selected date range
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: colors.background.main }}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Billable
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.border.DEFAULT }}>
                  {timesheets.map((entry) => (
                    <tr key={entry.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: colors.background.card }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div style={{ color: colors.text.primary }}>
                          {formatDate(entry.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: colors.text.primary }}>
                          {entry.jobs?.job_name || 'Unknown Job'}
                        </div>
                        <div className="text-xs" style={{ color: colors.text.secondary }}>
                          {entry.jobs?.job_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div style={{ color: colors.text.primary }}>
                          {formatTime12Hour(entry.start_time)} - {formatTime12Hour(entry.end_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium" style={{ color: colors.text.primary }}>
                          {entry.hours.toFixed(2)}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium" style={{ color: colors.semantic.success }}>
                          ${(entry.hours * entry.hourly_rate).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: entry.is_billable ? colors.semantic.success + '20' : colors.text.muted + '20',
                            color: entry.is_billable ? colors.semantic.success : colors.text.muted
                          }}
                        >
                          {entry.is_billable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: colors.background.main,
                              color: colors.accent.DEFAULT
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: colors.background.main,
                              color: colors.semantic.error
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.background.card }}>
            <div className="p-6 border-b" style={{ borderColor: colors.border.DEFAULT }}>
              <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                {editingEntry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Job <span style={{ color: colors.semantic.error }}>*</span>
                </label>
                <select
                  value={formData.job_id}
                  onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    '--tw-ring-color': colors.accent.DEFAULT
                  } as any}
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_number} - {job.job_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Date <span style={{ color: colors.semantic.error }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    '--tw-ring-color': colors.accent.DEFAULT
                  } as any}
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Start Time <span style={{ color: colors.semantic.error }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.background.main,
                      color: colors.text.primary,
                      borderColor: colors.border,
                      '--tw-ring-color': colors.accent.DEFAULT
                    } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    End Time <span style={{ color: colors.semantic.error }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.background.main,
                      color: colors.text.primary,
                      borderColor: colors.border,
                      '--tw-ring-color': colors.accent.DEFAULT
                    } as any}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    '--tw-ring-color': colors.accent.DEFAULT
                  } as any}
                />
              </div>

              {/* Billable */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_billable"
                  checked={formData.is_billable}
                  onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
                  className="rounded"
                  style={{
                    accentColor: colors.accent.DEFAULT
                  }}
                />
                <label htmlFor="is_billable" className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Billable
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setEditingEntry(null)
                    resetForm()
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: colors.background.main,
                    color: colors.text.secondary
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: 'white'
                  }}
                >
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
