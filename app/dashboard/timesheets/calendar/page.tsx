'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

type TimesheetEntry = {
  id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  jobs?: { job_name: string }
  status: string
  notes?: string
}

export default function TimesheetCalendarPage() {
  const [currentView, setCurrentView] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
  }, [currentDate, currentView])

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range based on view
      let startDate: string
      let endDate: string

      if (currentView === 'day') {
        startDate = endDate = currentDate.toISOString().split('T')[0]
      } else if (currentView === 'week') {
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

      if (data) setEntries(data)
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHours = () => {
    setSelectedDate(currentDate.toISOString().split('T')[0])
    setShowAddModal(true)
  }

  const renderDayView = () => {
    const dayEntries = entries.filter(
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
            Total: <strong className="text-blue-500 text-xl">{totalHours.toFixed(1)} hours</strong>
          </p>
        </div>
        <div className="p-8">
          {/* Time slots */}
          <div className="space-y-4">
            {dayEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No time entries for this day</p>
                <button 
                  onClick={() => handleAddHours()}
                  className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  + Add Hours
                </button>
              </div>
            ) : (
              dayEntries.map((entry) => (
                <div key={entry.id} className="p-6 bg-gray-50 rounded-xl border-l-4 border-blue-500 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 text-lg">
                      {entry.start_time} - {entry.end_time}
                    </span>
                    <span className="font-bold text-blue-500 text-lg">{entry.total_hours} hrs</span>
                  </div>
                  <p className="text-gray-600">🔧 {entry.jobs?.job_name || 'General Work'}</p>
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
      const dayEntries = entries.filter(
        entry => entry.date === day.toISOString().split('T')[0]
      )
      return total + dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    }, 0)
    
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {days.map((day, i) => (
            <div key={day} className="p-4 text-center">
              <div className="font-semibold text-blue-500">{day}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {weekDays[i].getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day, i) => {
            const dayEntries = entries.filter(
              entry => entry.date === day.toISOString().split('T')[0]
            )
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
            
            return (
              <div
                key={i}
                className="p-4 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors min-h-[140px]"
                onClick={() => {
                  setCurrentDate(day)
                  setCurrentView('day')
                }}
              >
                {dayTotal > 0 && (
                  <>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-semibold mb-2 inline-block">
                      {dayTotal.toFixed(1)} hrs
                    </div>
                    {dayEntries.slice(0, 2).map((entry, idx) => (
                      <div key={idx} className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-xs mt-1 truncate">
                        {entry.jobs?.job_name || 'General'}
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
          <span className="text-4xl font-bold text-blue-500">{weekTotal.toFixed(1)} hrs</span>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthTotal = entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
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
            <div key={day} className="p-4 text-center font-semibold text-blue-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, i) => {
            const dayEntries = entries.filter(
              entry => entry.date === date.toISOString().split('T')[0]
            )
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
            
            return (
              <div
                key={i}
                className={`p-3 border-r border-b min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
                onClick={() => {
                  if (isCurrentMonth) {
                    setCurrentDate(date)
                    setCurrentView('day')
                  }
                }}
              >
                <div className={`font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </div>
                {dayTotal > 0 && isCurrentMonth && (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold mt-2 inline-block">
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
          <span className="text-4xl font-bold text-blue-500">{monthTotal.toFixed(1)} hrs</span>
        </div>
      </div>
    )
  }

  const prevPeriod = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (currentView === 'week') {
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
    if (currentView === 'day') {
      return currentDate.toLocaleDateString('en-AU', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } else if (currentView === 'week') {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Timesheet Calendar</h1>
        <p className="text-gray-600 mt-2">View and manage your time entries</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 items-center">
          <button 
            onClick={goToToday}
            className="px-5 py-2 bg-blue-50 text-blue-500 rounded-lg font-semibold text-sm hover:bg-blue-100"
          >
            Today
          </button>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            {['day', 'week', 'month'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                  currentView === view
                    ? 'bg-blue-500 text-white shadow-md'
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
            className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center text-lg"
          >
            ‹
          </button>
          <span className="text-xl font-semibold text-gray-900 min-w-[280px] text-center">
            {getDisplayTitle()}
          </span>
          <button 
            onClick={nextPeriod}
            className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center text-lg"
          >
            ›
          </button>
        </div>

        <button 
          onClick={() => handleAddHours()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-blue-600"
        >
          + Add Hours
        </button>
      </div>

      {/* Views */}
      {currentView === 'day' && renderDayView()}
      {currentView === 'week' && renderWeekView()}
      {currentView === 'month' && renderMonthView()}

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
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
              
              <p className="text-sm text-gray-600">
                Manual time entry functionality will be available once the system is fully configured. Use the main timesheets page for clock in/out functionality.
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
                  window.location.href = '/dashboard/timesheets'
                }}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Go to Clock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}