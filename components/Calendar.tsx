"use client";
import { useState } from 'react';
import { colors } from '@/lib/colors';

export type CalendarView = 'month' | 'week' | 'day';
export type Appointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  jobId?: string;
};

function getCalendarDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // Previous month days (fill first week)
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    calendarDays.push({ date: prevDate, isCurrentMonth: false });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push({ date, isCurrentMonth: true });
  }
  
  // Next month days (fill last week to complete 6 weeks = 42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarDays.push({ date: nextDate, isCurrentMonth: false });
  }
  
  return calendarDays;
}

export default function Calendar({
  appointments,
  onCreate,
}: {
  appointments: Appointment[];
  onCreate: (date: Date) => void;
}) {
  const handleAppointmentClick = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation();
    if (appointment.jobId) {
      window.location.href = `/dashboard/jobs/${appointment.jobId}`;
    }
  };
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayClicked, setTodayClicked] = useState(false);

  // Month view
  const calendarDays = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());

  // Week view
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Day view
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 8am-7pm

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDisplayTitle = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-x-auto">
        <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0">
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setTodayClicked(true);
            }}
            className="px-3 sm:px-5 py-2 bg-orange-50 text-orange-500 rounded-lg font-semibold text-sm hover:bg-orange-100 whitespace-nowrap"
          >
            Today
          </button>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            {['month', 'week', 'day'].map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => setView(viewOption as CalendarView)}
                className={`px-3 sm:px-6 py-2 rounded-lg font-semibold text-sm transition-all capitalize whitespace-nowrap ${
                  view === viewOption
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {viewOption}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4 items-center flex-shrink-0">
          <button
            onClick={navigatePrevious}
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
          >
            ‹
          </button>
          <span className="text-base sm:text-xl font-semibold text-gray-900 min-w-[200px] sm:min-w-[280px] text-center">
            {getDisplayTitle()}
          </span>
          <button
            onClick={navigateNext}
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center text-lg"
          >
            ›
          </button>
        </div>

        <button
          onClick={() => onCreate(new Date())}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-orange-600 whitespace-nowrap"
        >
          + Schedule
        </button>
      </div>
      {/* Month view */}
      {view === 'month' && (
        <div>
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, idx) => (
              <div key={day} className="p-2 sm:p-4 text-center font-semibold text-orange-500">
                <span className="hidden sm:inline">{day}</span>
                <span className="inline sm:hidden text-xs">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayAppointments = appointments.filter(a => a.start.toDateString() === date.toDateString());
              
              return (
                <div
                  key={date.toISOString()}
                  className={`p-1 sm:p-3 border-r border-b min-h-[80px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden ${
                    todayClicked && isToday ? 'bg-orange-50' : ''
                  } ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                  style={{ borderColor: '#e5e7eb' }}
                  onClick={() => isCurrentMonth && onCreate(date)}
                >
                  <div className={`font-semibold mb-1 sm:mb-2 text-xs sm:text-sm ${
                    isToday ? 'text-orange-500' : 
                    !isCurrentMonth ? 'text-gray-400' : 
                    'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(a => (
                        <div 
                          key={a.id} 
                          className="px-1 sm:px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition truncate"
                          style={{ backgroundColor: a.color || '#3b82f6', color: 'white' }}
                          onClick={(e) => handleAppointmentClick(e, a)}
                        >
                          {a.title}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <strong className="text-gray-900">
              {currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} Total:
            </strong>
            <span className="text-4xl font-bold text-orange-500">
              {appointments.filter(a => 
                a.start.getMonth() === currentDate.getMonth() && 
                a.start.getFullYear() === currentDate.getFullYear()
              ).length} appointments
            </span>
          </div>
        </div>
      )}
      {/* Week view */}
      {view === 'week' && (
        <div>
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {weekDays.map((day, i) => (
              <div key={day.toISOString()} className="p-2 sm:p-4 text-center">
                <div className="font-semibold text-orange-500 text-xs sm:text-sm">
                  <span className="hidden sm:inline">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span className="inline sm:hidden">
                    {day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[400px] sm:min-h-[500px]">
            {weekDays.map((day, i) => {
              const dayAppointments = appointments.filter(a => a.start.toDateString() === day.toDateString());
              
              return (
                <div
                  key={i}
                  className="p-2 sm:p-4 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px] sm:min-h-[140px] overflow-hidden"
                  style={{ borderColor: '#e5e7eb' }}
                  onClick={() => onCreate(day)}
                >
                  <div className="space-y-1 sm:space-y-2">
                    {dayAppointments.map((appointment, idx) => (
                      <div 
                        key={idx} 
                        className="px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs font-semibold cursor-pointer hover:opacity-80 transition truncate"
                        style={{ backgroundColor: appointment.color || '#3b82f6', color: 'white' }}
                        onClick={(e) => handleAppointmentClick(e, appointment)}
                      >
                        {appointment.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <strong className="text-gray-900">Week Total:</strong>
            <span className="text-4xl font-bold text-orange-500">
              {weekDays.reduce((total, day) => {
                return total + appointments.filter(a => a.start.toDateString() === day.toDateString()).length;
              }, 0)} appointments
            </span>
          </div>
        </div>
      )}
      {/* Day view */}
      {view === 'day' && (
        <div>
          <div className="p-4 sm:p-6 lg:p-8 border-b">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-AU', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h2>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-4">
              {appointments.filter(a => a.start.toDateString() === currentDate.toDateString()).length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-base sm:text-lg">No appointments for this day</p>
                  <button 
                    onClick={() => onCreate(currentDate)}
                    className="mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 text-sm sm:text-base"
                  >
                    + Schedule Appointment
                  </button>
                </div>
              ) : (
                appointments.filter(a => a.start.toDateString() === currentDate.toDateString()).map((appointment) => (
                  <div key={appointment.id} className="p-4 sm:p-6 bg-gray-50 rounded-xl border-l-4 hover:bg-gray-100 transition-colors" style={{ borderLeftColor: appointment.color || '#3b82f6' }}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                      <span className="font-semibold text-gray-900 text-base sm:text-lg">
                        {appointment.start.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={(e) => handleAppointmentClick(e, appointment)}
                        className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-800 self-start sm:self-auto"
                      >
                        View Job
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">📅 {appointment.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
