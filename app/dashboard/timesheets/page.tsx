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
  FileText
} from 'lucide-react'
import { TimesheetEventType, ClockInType, ActiveShift as ActiveShiftType, TimesheetEntry as TimesheetEntryType, Job } from '@/lib/types'

export default function TimesheetsPage() {
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState<ActiveShiftType | null>(null)
  const [todayEntries, setTodayEntries] = useState<TimesheetEntryType[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [clockInType, setClockInType] = useState<ClockInType>('work')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timezone, setTimezone] = useState('Australia/Sydney') // Default, will be loaded from settings
  
  // View state
  const [currentView, setCurrentView] = useState('clock')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState('week')
  const [calendarEntries, setCalendarEntries] = useState<TimesheetEntryType[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (currentView === 'calendar') {
      loadCalendarEntries()
    }
  }, [currentView, currentDate, calendarView])

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

      // Load active shift
      const { data: shiftData } = await supabase
        .from('active_shifts')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .is('clock_out_time', null)
        .single()

      if (shiftData) setActiveShift(shiftData)

      // Load today's entries
      const today = new Date().toISOString().split('T')[0]
      const { data: entriesData } = await supabase
        .from('timesheet_entries')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('start_time')

      if (entriesData) setTodayEntries(entriesData)

      // Load jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, job_name, enquiry_number, user_id, client_id, job_address, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (jobsData) setJobs(jobsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    // Validation: job required for 'work' and 'measure_quote' types
    if ((clockInType === 'work' || clockInType === 'measure_quote') && !selectedJob) {
      alert('Please select a job')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use local time to ensure consistency
      const now = new Date()
      
      const clockInData = {
        user_id: user.id,
        staff_member_id: user.id,
        clock_in_time: now.toISOString(),
        event_type: clockInType,
        job_id: selectedJob || null,
      }
      
      const { error } = await supabase
        .from('active_shifts')
        .insert(clockInData)

      if (!error) {
        loadData()
        // Replace alert with console log for professional UX
        console.log('Successfully clocked in')
      }
    } catch (error) {
      alert('Error clocking in')
    }
  }

  const handleClockOut = async () => {
    if (!activeShift) return

    if (!confirm('Clock out from this shift?')) return

    try {
      const clockOutTime = new Date()
      const clockInTime = new Date(activeShift.clock_in_time)
      
      // Calculate hours
      const diffMs = clockOutTime.getTime() - clockInTime.getTime()
      const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Format times in local timezone (HH:MM:SS)
      const formatLocalTime = (date: Date) => {
        return date.toLocaleTimeString('en-AU', { hour12: false, timeZone: timezone })
      }

      // Create timesheet entry
      await supabase
        .from('timesheet_entries')
        .insert({
          user_id: user.id,
          staff_member_id: user.id,
          date: clockOutTime.toLocaleDateString('en-AU', { timeZone: timezone }).split('/').reverse().join('-'),
          start_time: formatLocalTime(clockInTime),
          end_time: formatLocalTime(clockOutTime),
          total_hours: totalHours,
          job_id: activeShift.job_id,
          event_type: activeShift.event_type || 'work',
          entry_type: 'clock',
          status: 'pending',
        })

      // Update active shift
      await supabase
        .from('active_shifts')
        .update({ clock_out_time: clockOutTime.toISOString() })
        .eq('id', activeShift.id)

      loadData()
      setSelectedJob('')
      // Replace alert with console log for professional UX  
      console.log('Successfully clocked out')
    } catch (error) {
      alert('Error clocking out')
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
      return `M&Q - ${entry.jobs?.job_name ?? 'Unknown Job'}`
    }
    return 'General Admin'
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
        .from('timesheet_entries')
        .select('*, jobs(job_name)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('start_time')

      if (data) setCalendarEntries(data)
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
        <div className="p-8 border-b">
          <h2 className="text-3xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-AU', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </h2>
          <p className="text-gray-600 mt-2">
            Total: <strong className="text-orange-600 text-xl">{totalHours.toFixed(1)} hours</strong>
          </p>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            {dayEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No time entries for this day</p>
                <button 
                  onClick={() => handleAddHours()}
                  className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
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
            <div key={day} className="p-4 text-center">
              <div className="font-semibold text-orange-600">{day}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {weekDays[i].getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day, i) => {
            const dayEntries = calendarEntries.filter(
              entry => entry.date === day.toISOString().split('T')[0]
            )
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
            
            return (
              <div
                key={i}
                className="p-4 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors min-h-[140px]"
                style={{ borderColor: '#e5e7eb' }}
                onClick={() => {
                  setCurrentDate(day)
                  setCalendarView('day')
                }}
              >
                {dayTotal > 0 && (
                  <>
                    <div className="bg-orange-600 text-white px-3 py-1 rounded-md text-xs font-semibold mb-2 inline-block">
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
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <strong className="text-gray-900">Week Total:</strong>
          <span className="text-4xl font-bold text-orange-600">{weekTotal.toFixed(1)} hrs</span>
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
            <div key={day} className="p-4 text-center font-semibold text-orange-600">
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
                className={`p-3 border-r border-b min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
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
                <div className={`font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </div>
                {dayTotal > 0 && isCurrentMonth && (
                  <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold mt-2 inline-block">
                    {dayTotal.toFixed(1)}h
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <strong className="text-gray-900">
            {currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} Total:
          </strong>
          <span className="text-4xl font-bold text-orange-600">{monthTotal.toFixed(1)} hrs</span>
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
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all ${
            currentView === 'clock'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Clock size={18} />
          Clock In/Out
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all ${
            currentView === 'calendar'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar size={18} />
          Calendar
        </button>
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

                  {/* Job Selector */}
                  <label className="block text-sm font-semibold text-gray-600 mb-2 text-left">
                    Select Job {clockInType === 'general_admin' ? '(Optional)' : ''}
                  </label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:ring-4 mb-6 ${
                      clockInType === 'work' ? 'focus:border-orange-500 focus:ring-orange-100' :
                      clockInType === 'measure_quote' ? 'focus:border-amber-500 focus:ring-amber-100' :
                      'focus:border-gray-500 focus:ring-gray-100'
                    }`}
                  >
                    <option value="">Select a job...</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.status === 'enquiry' && job.enquiry_number 
                          ? `${job.enquiry_number} - ${job.job_name}` 
                          : job.job_name
                        }
                      </option>
                    ))}
                  </select>

                  {/* Info for general admin */}
                  {clockInType === 'general_admin' && !selectedJob && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-600 text-center">
                        General admin work (not tied to a specific job)
                      </p>
                    </div>
                  )}
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
                        {activeShift.event_type === 'measure_quote' ? 'M&Q:' : 
                         activeShift.event_type === 'general_admin' ? 'Type:' : 'Job:'}
                      </span>
                      <span className="text-gray-600">
                        {activeShift.event_type === 'measure_quote' ? 
                          `M&Q - ${activeShift.jobs?.job_name || 'Unknown Job'}` :
                         activeShift.event_type === 'general_admin' ? 
                          'General Admin' :
                          (activeShift.jobs?.job_name || 'Unknown Job')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClockOut}
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
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-3 items-center">
              <button 
                onClick={goToToday}
                className="px-5 py-2 bg-orange-50 text-orange-600 rounded-lg font-semibold text-sm hover:bg-orange-100"
              >
                Today
              </button>
              <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
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

            <div className="flex gap-4 items-center">
              <button 
                onClick={prevPeriod}
                className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
              >
                ‹
              </button>
              <span className="text-xl font-semibold text-gray-900 min-w-[280px] text-center">
                {getDisplayTitle()}
              </span>
              <button 
                onClick={nextPeriod}
                className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
              >
                ›
              </button>
            </div>

            <button 
              onClick={() => handleAddHours()}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-orange-700"
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
    </div>
  )
}