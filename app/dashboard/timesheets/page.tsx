'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Wrench, 
  Briefcase, 
  FileText,
  X
} from 'lucide-react'
import { TimesheetEventType, ClockInType, ActiveShift as ActiveShiftType, TimesheetEntry as TimesheetEntryType, Job } from '@/lib/types'
import { useToast } from '@/components/Toast'
import { isBusinessOwner } from '@/lib/permissions/check'
import { getBusinessId } from '@/lib/business'
import { Users, Edit2, Trash2, Plus } from 'lucide-react'

export default function TimesheetsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState<ActiveShiftType | null>(null)
  const [todayEntries, setTodayEntries] = useState<TimesheetEntryType[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [clockInType, setClockInType] = useState<ClockInType>('work')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timezone, setTimezone] = useState('Australia/Sydney') // Default, will be loaded from settings
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false)
  
  // View state
  const [currentView, setCurrentView] = useState('clock')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState('week')
  const [calendarEntries, setCalendarEntries] = useState<TimesheetEntryType[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  // Staff Hours Management state
  const [hasStaffPermission, setHasStaffPermission] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [staffTimesheets, setStaffTimesheets] = useState<any[]>([])
  const [staffStartDate, setStaffStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [staffEndDate, setStaffEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [formData, setFormData] = useState({
    job_id: '',
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    is_billable: true
  })

  useEffect(() => {
    loadData()
    checkStaffPermission()
    
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (currentView === 'calendar') {
      loadCalendarEntries()
    } else if (currentView === 'staff' && selectedStaffId) {
      loadStaffTimesheets()
    }
  }, [currentView, currentDate, calendarView, selectedStaffId, staffStartDate, staffEndDate])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load timezone from business settings
      const { data: businessSettings } = await supabase
        .from('business_settings')
        .select('timezone')
        .eq('user_id', user.id)
        .single()
      
      if (businessSettings?.timezone) {
        setTimezone(businessSettings.timezone)
      }

      // Load active shift (timesheet with no end_time)
      const { data: shiftData } = await supabase
        .from('timesheets')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (shiftData) {
        // Map timesheets fields to activeShift structure
        // Parse the date and time components explicitly in local timezone
        const [hours, minutes, seconds] = shiftData.start_time.split(':').map(Number)
        const [year, month, day] = shiftData.date.split('-').map(Number)
        const clockInDate = new Date(year, month - 1, day, hours, minutes, seconds)
        
        console.log('Loaded active shift:', {
          date: shiftData.date,
          start_time: shiftData.start_time,
          reconstructed: clockInDate.toISOString(),
          localString: clockInDate.toString(),
          nowForComparison: new Date().toString()
        })
        
        setActiveShift({
          id: shiftData.id,
          user_id: shiftData.user_id,
          staff_member_id: shiftData.staff_id,
          clock_in_time: clockInDate.toISOString(),
          clock_out_time: null,
          event_type: 'work',
          job_id: shiftData.job_id,
          enquiry_id: null,
          jobs: shiftData.jobs
        } as any)
      }

      // Load today's entries
      const today = new Date().toISOString().split('T')[0]
      const { data: entriesData } = await supabase
        .from('timesheets')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .eq('date', today)
        .not('end_time', 'is', null)
        .order('start_time')

      if (entriesData) {
        // Map timesheets to timesheet entries format
        const mappedEntries = entriesData.map((entry: any) => ({
          id: entry.id,
          user_id: entry.user_id,
          staff_member_id: entry.staff_id,
          date: entry.date,
          start_time: entry.start_time,
          end_time: entry.end_time,
          total_hours: entry.hours,
          job_id: entry.job_id,
          enquiry_id: undefined,
          event_type: 'work' as TimesheetEventType,
          entry_type: 'clock' as const,
          status: 'pending' as const,
          jobs: entry.jobs,
          created_at: entry.created_at,
          updated_at: entry.updated_at
        }))
        setTodayEntries(mappedEntries)
      }

      // Load jobs (excluding enquiry status - those are shown in measure & quote)
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, job_name, enquiry_number, user_id, client_id, status, created_at')
        .eq('user_id', user.id)
        .neq('status', 'enquiry')
        .order('created_at', { ascending: false })

      if (jobsData) setJobs(jobsData)
      
      // Load enquiries
      const { data: enquiriesData } = await supabase
        .from('enquiries')
        .select('id, enquiry_number, name, client_id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (enquiriesData) setEnquiries(enquiriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    console.log('Clock in button clicked')
    console.log('Clock in type:', clockInType)
    console.log('Selected job/enquiry:', selectedJob)
    
    // Validation: job/enquiry is required for timesheet
    if (!selectedJob) {
      toast('warning', clockInType === 'measure_quote' ? 'Please select an enquiry to clock in' : 'Please select a job to clock in')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user?.id)
      if (!user) {
        toast('error', 'Not authenticated. Please log in again.')
        return
      }

      let jobId = selectedJob

      // If measure & quote, find the job that matches the enquiry
      if (clockInType === 'measure_quote') {
        // Get the selected enquiry's enquiry_number
        const { data: enquiryData, error: enquiryError } = await supabase
          .from('enquiries')
          .select('enquiry_number')
          .eq('id', selectedJob)
          .single()

        if (enquiryError || !enquiryData) {
          console.error('Enquiry lookup error:', enquiryError)
          toast('error', 'The selected enquiry does not exist. Please refresh the page and try again.')
          return
        }

        console.log('Found enquiry number:', enquiryData.enquiry_number)

        // Find the job with matching enquiry_number
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('id')
          .eq('enquiry_number', enquiryData.enquiry_number)
          .single()

        if (jobError || !jobData) {
          console.error('Job lookup error:', jobError)
          toast('error', 'No job found for this enquiry. Please create a job from the enquiry first.')
          return
        }

        console.log('Found matching job:', jobData.id)
        jobId = jobData.id
      } else {
        // Verify the job exists for regular work
        const { data: jobExists, error: jobCheckError } = await supabase
          .from('jobs')
          .select('id')
          .eq('id', selectedJob)
          .single()

        if (jobCheckError || !jobExists) {
          console.error('Job validation error:', jobCheckError)
          toast('error', 'The selected job does not exist. Please refresh the page and try again.')
          return
        }
      }

      // Get business_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single()

      const businessId = profileData?.business_id

      // Get staff member's hourly rate and id
      let hourlyRate = 0
      let staffId = null
      if (businessId) {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, hourly_rate')
          .eq('user_id', user.id)
          .eq('business_id', businessId)
          .single()
        
        if (staffError) {
          console.error('Error fetching staff:', staffError)
          toast('error', 'Could not find your staff record. Please contact your administrator.')
          return
        }
        
        if (!staffData?.id) {
          console.error('Staff record found but has no ID:', staffData)
          toast('error', 'Invalid staff record. Please contact your administrator.')
          return
        }
        
        hourlyRate = staffData?.hourly_rate || 0
        staffId = staffData.id
        console.log('Staff lookup successful:', { staffData, hourlyRate, staffId, businessId, userId: user.id })
      } else {
        console.error('No business ID found for user')
        toast('error', 'Could not find your business. Please contact support.')
        return
      }

      // Use local time to ensure consistency
      const now = new Date()
      const todayDate = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0')
      const currentTime = String(now.getHours()).padStart(2, '0') + ':' + 
                          String(now.getMinutes()).padStart(2, '0') + ':' + 
                          String(now.getSeconds()).padStart(2, '0')
      
      console.log('Clock in time:', { todayDate, currentTime, now: now.toString() })
      
      const timesheetData = {
        user_id: user.id,
        staff_id: staffId,
        business_id: businessId,
        job_id: jobId,
        date: todayDate,
        start_time: currentTime,
        end_time: null,
        hours: 0,
        hourly_rate: hourlyRate,
        is_billable: true,
      }
      
      console.log('Attempting to clock in with data:', timesheetData)
      
      const { data, error } = await supabase
        .from('timesheets')
        .insert(timesheetData)
        .select()

      if (error) {
        console.error('Clock in error:', error)
        toast('error', `Failed to clock in: ${error.message}`)
        return
      }

      console.log('Clock in successful:', data)
      toast('success', 'Successfully clocked in!')
      setSelectedJob('')
      await loadData()
    } catch (error) {
      console.error('Unexpected error during clock in:', error)
      toast('error', 'Error clocking in. Check console for details.')
    }
  }

  const handleClockOutClick = () => {
    if (!activeShift) {
      toast('warning', 'No active shift to clock out from')
      return
    }
    setShowClockOutConfirm(true)
  }

  const handleClockOut = async () => {
    setShowClockOutConfirm(false)
    console.log('Clock out confirmed')
    console.log('Active shift:', activeShift)
    
    if (!activeShift) return

    try {
      const clockOutTime = new Date()
      const clockInTime = new Date(activeShift.clock_in_time)
      
      // Calculate hours
      const diffMs = clockOutTime.getTime() - clockInTime.getTime()
      const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast('error', 'Not authenticated. Please log in again.')
        return
      }

      // Format end time (HH:MM:SS)
      const endTime = clockOutTime.toTimeString().split(' ')[0]

      console.log('Updating timesheet with clock out time')

      // Update the timesheet record with end_time and hours
      const { error: updateError } = await supabase
        .from('timesheets')
        .update({ 
          end_time: endTime,
          hours: totalHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeShift.id)

      if (updateError) {
        console.error('Error updating timesheet:', updateError)
        toast('error', `Failed to clock out: ${updateError.message}`)
        return
      }

      console.log('Clock out successful')
      toast('success', 'Successfully clocked out!')
      setActiveShift(null)
      setSelectedJob('')
      await loadData()
    } catch (error) {
      console.error('Unexpected error during clock out:', error)
      toast('error', 'Error clocking out. Check console for details.')
    }
  }

  const formatElapsedTime = () => {
    if (!activeShift) return '0:00:00'
    
    const clockInTime = new Date(activeShift.clock_in_time)
    const diffMs = currentTime.getTime() - clockInTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Helper function to get timesheet entry display label
  const getTimesheetLabel = (entry: TimesheetEntryType): string => {
    if (entry.event_type === 'work') {
      return entry.jobs?.job_name ?? 'Unknown Job'
    }
    if (entry.event_type === 'measure_quote') {
      return entry.enquiries 
        ? `${entry.enquiries.enquiry_number} - ${entry.enquiries.name}` 
        : 'Unknown Enquiry'
    }
    return 'General Admin'
  }

  // Staff Hours Management Functions
  const checkStaffPermission = async () => {
    const isOwner = await isBusinessOwner()
    setHasStaffPermission(isOwner)
    if (isOwner) {
      loadStaff()
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

      if (data && data.length > 0 && !selectedStaffId) {
        setSelectedStaffId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    }
  }

  const loadStaffTimesheets = async () => {
    try {
      if (!selectedStaffId) return

      const { data, error } = await supabase
        .from('timesheets')
        .select('*, jobs(job_name, job_number)')
        .eq('staff_id', selectedStaffId)
        .gte('date', staffStartDate)
        .lte('date', staffEndDate)
        .not('end_time', 'is', null)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      setStaffTimesheets(data || [])
    } catch (error) {
      console.error('Error loading staff timesheets:', error)
      toast('error', 'Failed to load timesheet data')
    }
  }

  const handleEditEntry = (entry: any) => {
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

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timesheet entry?')) return

    try {
      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast('success', 'Timesheet entry deleted successfully')
      loadStaffTimesheets()
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast('error', 'Failed to delete timesheet entry')
    }
  }

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const selectedStaff = staff.find(s => s.id === selectedStaffId)
      if (!selectedStaff) {
        toast('error', 'Please select a staff member')
        return
      }

      const start = new Date(`${formData.date}T${formData.start_time}`)
      const end = new Date(`${formData.date}T${formData.end_time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

      if (hours <= 0) {
        toast('error', 'End time must be after start time')
        return
      }

      const businessId = await getBusinessId()

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
        const { error } = await supabase
          .from('timesheets')
          .update(timesheetData)
          .eq('id', editingEntry.id)

        if (error) throw error
        toast('success', 'Timesheet entry updated successfully')
      } else {
        const { error } = await supabase
          .from('timesheets')
          .insert(timesheetData)

        if (error) throw error
        toast('success', 'Timesheet entry added successfully')
      }

      setShowEditModal(false)
      setEditingEntry(null)
      resetForm()
      loadStaffTimesheets()
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
    setShowEditModal(true)
  }

  const formatTime12Hour = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatStaffDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalHours = () => {
    return staffTimesheets.reduce((sum, entry) => sum + entry.hours, 0)
  }

  const getTotalCost = () => {
    return staffTimesheets.reduce((sum, entry) => sum + (entry.hours * entry.hourly_rate), 0)
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

    setStaffStartDate(start.toISOString().split('T')[0])
    setStaffEndDate(end.toISOString().split('T')[0])
  }

  const loadCalendarEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range based on view
      let startDate: string
      let endDate: string

      if (calendarView === 'day') {
        startDate = endDate = currentDate.toISOString().split('T')[0]
      } else if (calendarView === 'week') {
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
        
        startDate = startOfWeek.toISOString().split('T')[0]
        endDate = endOfWeek.toISOString().split('T')[0]
      } else {
        // Month view
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        
        startDate = startOfMonth.toISOString().split('T')[0]
        endDate = endOfMonth.toISOString().split('T')[0]
      }

      const { data } = await supabase
        .from('timesheets')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('end_time', 'is', null)
        .order('date')
        .order('start_time')

      if (data) {
        // Map timesheets to timesheet entries format
        const mappedEntries = data.map((entry: any) => ({
          id: entry.id,
          user_id: entry.user_id,
          staff_member_id: entry.staff_id,
          date: entry.date,
          start_time: entry.start_time,
          end_time: entry.end_time,
          total_hours: entry.hours,
          job_id: entry.job_id,
          enquiry_id: undefined,
          event_type: 'work' as TimesheetEventType,
          entry_type: 'clock' as const,
          status: 'pending' as const,
          jobs: entry.jobs,
          created_at: entry.created_at,
          updated_at: entry.updated_at
        }))
        setCalendarEntries(mappedEntries)
      }
    } catch (error) {
      console.error('Error loading calendar entries:', error)
    }
  }

  const handleAddHours = (date?: string) => {
    setSelectedDate(date || currentDate.toISOString().split('T')[0])
    setShowAddModal(true)
  }

  const renderDayView = () => {
    const dayEntries = calendarEntries.filter(
      entry => entry.date === currentDate.toISOString().split('T')[0]
    )
    const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)

    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-AU', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </h2>
          <p className="text-gray-600 mt-2">
            Total: <strong className="text-orange-600 text-lg sm:text-xl">{totalHours.toFixed(1)} hours</strong>
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {dayEntries.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">No time entries for this day</p>
                <button 
                  onClick={() => handleAddHours()}
                  className="mt-4 px-5 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                >
                  + Add Hours
                </button>
              </div>
            ) : (
              dayEntries.map((entry) => (
                <div key={entry.id} className="p-6 bg-gray-50 rounded-xl border-l-4 border-orange-500 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 text-lg">
                      {entry.start_time} - {entry.end_time}
                    </span>
                    <span className="font-bold text-orange-600 text-lg">{entry.total_hours} hrs</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-gray-400" />
                    <p className="text-gray-600">{getTimesheetLabel(entry)}</p>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
                  )}
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                    entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                    entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
    
    const weekDays = [...Array(7)].map((_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })

    const weekTotal = weekDays.reduce((total, day) => {
      const dayEntries = calendarEntries.filter(
        entry => entry.date === day.toISOString().split('T')[0]
      )
      return total + dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    }, 0)
    
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {days.map((day, i) => (
            <div key={day} className="p-2 sm:p-3 text-center">
              <div className="font-semibold text-orange-600 text-sm">{day}</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {weekDays[i].getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[400px] sm:min-h-[500px]">
          {weekDays.map((day, i) => {
            const dayEntries = calendarEntries.filter(
              entry => entry.date === day.toISOString().split('T')[0]
            )
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
            
            return (
              <div
                key={i}
                className="p-2 sm:p-3 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors min-h-[120px]"
                style={{ borderColor: '#e5e7eb' }}
                onClick={() => {
                  setCurrentDate(day)
                  setCalendarView('day')
                }}
              >
                {dayTotal > 0 && (
                  <>
                    <div className="bg-orange-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold mb-2 inline-block">
                      {dayTotal.toFixed(1)} hrs
                    </div>
                    {dayEntries.slice(0, 2).map((entry, idx) => (
                      <div key={idx} className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs mt-1 truncate">
                        {getTimesheetLabel(entry)}
                      </div>
                    ))}
                    {dayEntries.length > 2 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{dayEntries.length - 2} more
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-between items-center">
          <strong className="text-gray-900 text-sm sm:text-base">Week Total:</strong>
          <span className="text-2xl sm:text-4xl font-bold text-orange-600">{weekTotal.toFixed(1)} hrs</span>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthTotal = calendarEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    
    // Create calendar grid (6 weeks x 7 days = 42 cells)
    const calendarDays = []
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i)
      calendarDays.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      calendarDays.push({ date, isCurrentMonth: true })
    }
    
    // Next month days to fill grid
    const remainingCells = 42 - calendarDays.length
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day)
      calendarDays.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 sm:p-3 text-center font-semibold text-orange-600 text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, i) => {
            const dayEntries = calendarEntries.filter(
              entry => entry.date === date.toISOString().split('T')[0]
            )
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
            
            return (
              <div
                key={i}
                className={`p-2 border-r border-b min-h-[80px] sm:min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
                style={{ borderColor: '#e5e7eb' }}
                onClick={() => {
                  if (isCurrentMonth) {
                    setCurrentDate(date)
                    setCalendarView('day')
                  }
                }}
              >
                <div className={`font-semibold text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </div>
                {dayTotal > 0 && isCurrentMonth && (
                  <div className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold mt-2 inline-block">
                    {dayTotal.toFixed(1)}h
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-between items-center">
          <strong className="text-gray-900 text-sm sm:text-base">
            {currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} Total:
          </strong>
          <span className="text-2xl sm:text-4xl font-bold text-orange-600">{monthTotal.toFixed(1)} hrs</span>
        </div>
      </div>
    )
  }

  const prevPeriod = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDisplayTitle = () => {
    if (calendarView === 'day') {
      return currentDate.toLocaleDateString('en-AU', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return `${startOfWeek.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#3b82f6' }}></div>
      </div>
    )
  }

  const totalToday = todayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          {/* Icon Badge */}
          <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6 text-teal-600" />
          </div>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Timesheets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {(() => {
                const totalHoursToday = todayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
                return `${totalHoursToday.toFixed(1)} hours logged today`;
              })()}
            </p>
          </div>
        </div>
        
        {/* Right: Settings Button */}
        <Link
          href="/dashboard/settings/timesheets"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
        >
          ⚙️ Settings
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm w-fit">
        <button
          onClick={() => setCurrentView('clock')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            currentView === 'clock'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Clock size={16} />
          Clock In/Out
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            currentView === 'calendar'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar size={16} />
          Calendar
        </button>
        {hasStaffPermission && (
          <button
            onClick={() => setCurrentView('staff')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              currentView === 'staff'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users size={16} />
            Staff Hours
          </button>
        )}
      </div>

      {/* CLOCK IN/OUT VIEW */}
      {currentView === 'clock' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-12 text-center shadow-sm">
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-8"
              style={{
                backgroundColor: activeShift ? '#dcfce7' : '#fef2f2',
                color: activeShift ? '#16a34a' : '#dc2626',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'currentColor' }}></span>
              {activeShift ? 'Clocked In' : 'Clocked Out'}
            </div>

            <div className="text-6xl font-bold mb-10" style={{ color: colors.text.primary }}>
              {currentTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {activeShift && (
              <div className="mb-8">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Time Elapsed
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatElapsedTime()}
                </div>
              </div>
            )}

            {!activeShift ? (
              <>
                <div className="max-w-md mx-auto mb-10">
                  {/* Work Type Selector */}
                  <label className="block text-sm font-semibold text-gray-600 mb-2 text-left">
                    Work Type
                  </label>
                  <div className="flex gap-2 mb-6">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        clockInType === 'work'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setClockInType('work')}
                    >
                      Work
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        clockInType === 'measure_quote'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setClockInType('measure_quote')}
                    >
                      M&Q
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        clockInType === 'general_admin'
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setClockInType('general_admin')}
                    >
                      General Admin
                    </button>
                  </div>

                  {/* Job/Enquiry Selector */}
                  <label className="block text-sm font-semibold text-gray-600 mb-2 text-left">
                    {clockInType === 'measure_quote' ? 'Select Enquiry' : 'Select Job'}
                  </label>
                  <div className="relative mb-6">
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className={`w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl text-base focus:ring-4 appearance-none ${
                        clockInType === 'work' ? 'focus:border-orange-500 focus:ring-orange-100' :
                        clockInType === 'measure_quote' ? 'focus:border-amber-500 focus:ring-amber-100' :
                        'focus:border-gray-500 focus:ring-gray-100'
                      }`}
                    >
                      <option value="">{clockInType === 'measure_quote' ? 'Select an enquiry...' : 'Select a job...'}</option>
                      {clockInType === 'measure_quote' ? (
                        enquiries.map((enquiry) => (
                          <option key={enquiry.id} value={enquiry.id}>
                            {enquiry.enquiry_number} - {enquiry.name}
                          </option>
                        ))
                      ) : (
                        jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.status === 'enquiry' && job.enquiry_number 
                              ? `${job.enquiry_number} - ${job.job_name}` 
                              : job.job_name
                            }
                          </option>
                        ))
                      )}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={handleClockIn}
                  className={`w-52 h-52 rounded-full text-white text-xl font-bold shadow-2xl hover:scale-105 transition-transform mx-auto block ${
                    clockInType === 'work' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    clockInType === 'measure_quote' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}
                  style={{ 
                    boxShadow: clockInType === 'work' ? '0 20px 40px rgba(59, 130, 246, 0.3)' :
                              clockInType === 'measure_quote' ? '0 20px 40px rgba(245, 158, 11, 0.3)' :
                              '0 20px 40px rgba(107, 114, 128, 0.3)'
                  }}
                >
                  CLOCK IN
                </button>
              </>
            ) : (
              <>
                <div className="max-w-md mx-auto mb-10 bg-gray-50 rounded-xl p-6 text-left">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Current Shift
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Started:</span>
                      <span className="text-gray-600">
                        {new Date(activeShift.clock_in_time).toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: timezone
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        {activeShift.event_type === 'measure_quote' ? 'Enquiry:' : 
                         activeShift.event_type === 'general_admin' ? 'Type:' : 'Job:'}
                      </span>
                      <span className="text-gray-600">
                        {activeShift.event_type === 'measure_quote' ? 
                          (activeShift.enquiries ? `${activeShift.enquiries.enquiry_number} - ${activeShift.enquiries.name}` : 'Unknown Enquiry') :
                         activeShift.event_type === 'general_admin' ? 
                          'General Admin' :
                          (activeShift.jobs?.job_name || 'Unknown Job')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClockOutClick}
                  className="w-52 h-52 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xl font-bold shadow-2xl hover:scale-105 transition-transform mx-auto block"
                  style={{ boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3)' }}
                >
                  CLOCK OUT
                </button>
              </>
            )}
          </div>

          {/* Today Summary */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
              Today's Hours
            </h3>

            <div className="space-y-3 mb-6">
              {todayEntries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No entries yet today</p>
              ) : (
                todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 bg-gray-50 rounded-xl border-l-4 border-orange-500"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-orange-600 text-sm">
                        {getTimesheetLabel(entry)}
                      </span>
                      <span className="font-bold text-gray-900">{entry.total_hours}h</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {entry.start_time} - {entry.end_time}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 text-white">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Today</span>
                <span className="text-3xl font-bold">{totalToday.toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {currentView === 'calendar' && (
        <div>
          {/* Calendar Toolbar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 mb-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <button 
                onClick={goToToday}
                className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg font-semibold text-sm hover:bg-orange-100"
              >
                Today
              </button>
              <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                      calendarView === view
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button 
                onClick={prevPeriod}
                className="w-9 h-9 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
              >
                ‹
              </button>
              <span className="text-base sm:text-lg font-semibold text-gray-900 min-w-[180px] sm:min-w-[240px] text-center">
                {getDisplayTitle()}
              </span>
              <button 
                onClick={nextPeriod}
                className="w-9 h-9 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
              >
                ›
              </button>
            </div>

            <button 
              onClick={() => handleAddHours()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-orange-700 whitespace-nowrap"
            >
              + Add Hours
            </button>
          </div>

          {/* Views */}
          {calendarView === 'day' && renderDayView()}
          {calendarView === 'week' && renderWeekView()}
          {calendarView === 'month' && renderMonthView()}

          {/* Add Hours Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-lg flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Add Hours</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input 
                      type="date" 
                      value={selectedDate || ''} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Manual time entry functionality will be available once the system is fully configured. Use the Clock In/Out tab for time tracking.
                  </p>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setCurrentView('clock')
                    }}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                  >
                    Go to Clock
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAFF HOURS MANAGEMENT VIEW */}
      {currentView === 'staff' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl p-6" style={{ backgroundColor: colors.background.card }}>
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
                    borderColor: colors.border.DEFAULT
                  }}
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
                    value={staffStartDate}
                    onChange={(e) => setStaffStartDate(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.background.main,
                      color: colors.text.primary,
                      borderColor: colors.border.DEFAULT
                    }}
                  />
                  <span style={{ color: colors.text.secondary }}>to</span>
                  <input
                    type="date"
                    value={staffEndDate}
                    onChange={(e) => setStaffEndDate(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.background.main,
                      color: colors.text.primary,
                      borderColor: colors.border.DEFAULT
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setQuickRange('week')}
                    className="px-3 py-1 text-xs rounded-md transition-colors"
                    style={{
                      backgroundColor: colors.background.main,
                      color: colors.text.secondary,
                      border: `1px solid ${colors.border.DEFAULT}`
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
                      border: `1px solid ${colors.border.DEFAULT}`
                    }}
                  >
                    Last Month
                  </button>
                </div>
              </div>
            </div>

            {/* Add Entry Button */}
            {selectedStaffId && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: 'white'
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Add Entry
                </button>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {selectedStaffId && staffTimesheets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.background.card }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                      Total Hours
                    </p>
                    <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                      {getTotalHours().toFixed(2)}h
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
            ) : staffTimesheets.length === 0 ? (
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
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: colors.border.DEFAULT }}>
                    {staffTimesheets.map((entry) => (
                      <tr key={entry.id} className="hover:bg-opacity-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div style={{ color: colors.text.primary }}>
                            {formatStaffDate(entry.date)}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-2 rounded-lg transition-colors"
                              style={{
                                backgroundColor: colors.background.main,
                                color: colors.accent.DEFAULT
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
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
      )}

      {/* Add/Edit Entry Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.background.card }}>
            <div className="p-6 border-b" style={{ borderColor: colors.border.DEFAULT }}>
              <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                {editingEntry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
              </h2>
            </div>

            <form onSubmit={handleSubmitEntry} className="p-6 space-y-4">
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
                    borderColor: colors.border.DEFAULT
                  }}
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.status === 'enquiry' && job.enquiry_number 
                        ? `${job.enquiry_number} - ${job.job_name}`
                        : job.job_name
                      }
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
                    borderColor: colors.border.DEFAULT
                  }}
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
                      borderColor: colors.border.DEFAULT
                    }}
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
                      borderColor: colors.border.DEFAULT
                    }}
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
                    borderColor: colors.border.DEFAULT
                  }}
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

      {/* Clock Out Confirmation Modal */}
      {showClockOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-scale-in">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut className="w-6 h-6" style={{ color: colors.accent.DEFAULT }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                    Clock Out
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatElapsedTime()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClockOutConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-8">
              Are you sure you want to clock out from this shift?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowClockOutConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClockOut}
                className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}