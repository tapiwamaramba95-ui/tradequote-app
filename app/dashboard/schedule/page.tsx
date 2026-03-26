"use client";
import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/components/Calendar';
import { ScheduleEvent, ScheduleEventType, Job } from '@/lib/types';
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { colors } from '@/lib/colors';
import { getBusinessId } from '@/lib/business';

const Calendar = lazy(() => import('@/components/Calendar'));
const JobCreationForm = lazy(() => import('@/components/JobCreationForm'));

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTitle, setNewTitle] = useState('');
  // Staff & Job state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<Job[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<string>('all'); // 'all', 'measure_quote', 'work'
  const [eventType, setEventType] = useState<ScheduleEventType>('scheduled_work');

  // Fetch scheduled jobs on mount
  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  // Refresh jobs when filter changes
  useEffect(() => {
    fetchScheduledJobs();
  }, [scheduleFilter]);

  // Fetch staff, jobs and enquiries on modal open
  useEffect(() => {
    if (showModal) {
      fetchStaff();
      fetchJobs();
      fetchEnquiries();
    }
  }, [showModal]);

  const fetchScheduledJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const businessId = await getBusinessId();
    if (!businessId) return;

    // Fetch schedule_events
    let query = supabase
      .from('schedule_events')
      .select('*, jobs(job_name, id), staff(name)')
      .eq('user_id', user.id);

    // Apply event type filter
    if (scheduleFilter === 'measure_quote') {
      query = query.eq('event_type', 'measure_quote');
    } else if (scheduleFilter === 'work') {
      query = query.eq('event_type', 'scheduled_work');
    } else if (scheduleFilter !== 'all') {
      query = query.eq('event_type', scheduleFilter);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true });

    // Also fetch job_appointments
    const { data: jobAppointments } = await supabase
      .from('job_appointments')
      .select('*, jobs!job_id(job_name, id)')
      .eq('business_id', businessId)
      .order('scheduled_date', { ascending: true });

    // Also fetch from appointments table (main appointments)
    const { data: mainAppointments } = await supabase
      .from('appointments')
      .select('*, jobs(job_name, id), clients(name)')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });

    const allAppointments: Appointment[] = [];

    // Add schedule_events
    if (!error && data) {
      const eventAppointments: Appointment[] = data.map(event => {
        const title = getEventLabel(event);
        const color = getEventColor(event.event_type);
        
        return {
          id: event.id,
          title,
          start: new Date(event.scheduled_date),
          end: new Date(event.scheduled_date),
          color,
          jobId: event.job_id || undefined,
          enquiryId: event.enquiry_id || undefined,
          eventType: event.event_type,
        };
      });
      allAppointments.push(...eventAppointments);
    }

    // Add job_appointments
    if (jobAppointments) {
      const jobAppts: Appointment[] = jobAppointments
        .filter(apt => {
          // Apply filter
          if (scheduleFilter === 'measure_quote') return apt.appointment_type === 'measure_quote';
          if (scheduleFilter === 'work') return apt.appointment_type === 'work';
          if (scheduleFilter === 'admin') return false; // job appointments aren't admin tasks
          return true; // all
        })
        .map(apt => ({
          id: 'jobappt_' + apt.id,
          title: `${apt.appointment_type === 'measure_quote' ? 'M&Q' : 'Work'} - ${apt.jobs?.job_name || 'Job'}`,
          start: new Date(apt.scheduled_date),
          end: new Date(apt.scheduled_date),
          color: apt.appointment_type === 'measure_quote' ? '#F59E0B' : '#3B82F6',
          jobId: apt.job_id,
          eventType: apt.appointment_type as ScheduleEventType,
        }));
      allAppointments.push(...jobAppts);
    }

    // Add main appointments from appointments table
    if (mainAppointments) {
      const appts: Appointment[] = mainAppointments.map(apt => ({
        id: 'apt_' + apt.id,
        title: apt.title || (apt.jobs?.job_name ? `${apt.jobs.job_name}` : apt.clients?.name || 'Appointment'),
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        color: '#10B981', // green for general appointments
        jobId: apt.job_id || undefined,
        eventType: 'scheduled_work' as ScheduleEventType,
      }));
      allAppointments.push(...appts);
    }

    setAppointments(allAppointments);
  };

  const getEventLabel = (event: ScheduleEvent): string => {
    if (event.event_type === 'measure_quote') {
      return `M&Q - ${event.enquiries?.job_name ?? 'Unknown Client'}`;
    }
    if (event.event_type === 'scheduled_work') {
      return event.jobs?.job_name ?? 'Scheduled Work';
    }
    return event.title ?? 'Admin Task';
  };
  
  const getEventColor = (eventType: ScheduleEventType): string => {
    switch (eventType) {
      case 'measure_quote': return '#F59E0B'; // amber
      case 'scheduled_work': return '#3B82F6'; // blue  
      case 'admin': return '#6B7280'; // gray
      default: return '#3B82F6';
    }
  };

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const businessId = await getBusinessId();
    if (!businessId) return;

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId);
    if (!error && data) setStaffList(data);
  };

  const fetchJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const businessId = await getBusinessId();
    if (!businessId) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId);
    if (!error && data) setJobList(data as Job[]);
  };

  const fetchEnquiries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const businessId = await getBusinessId();
    if (!businessId) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'enquiry') // Only enquiries
      .order('created_at', { ascending: false });
    if (!error && data) setEnquiriesList(data as Job[]);
  };

  const handleAddStaff = (staff: any) => {
    if (!selectedStaff.some(s => s.id === staff.id)) {
      setSelectedStaff([...selectedStaff, staff]);
    }
  };
  const handleRemoveStaff = (staff: any) => {
    setSelectedStaff(selectedStaff.filter(s => s.id !== staff.id));
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setSelectedEnquiry(null);
    setJobSearch(job.job_name || '');
  };

  const handleSelectEnquiry = (enquiry: Job) => {
    setSelectedEnquiry(enquiry);
    setSelectedJob(null);
    setJobSearch(`${enquiry.job_name} - ${enquiry.description || 'M&Q'}`);
  };

  // Handler for JobCreationForm modal
  const handleJobCreated = (job: any) => {
    setJobList([...jobList, job]);
    setSelectedJob(job);
    setShowJobModal(false);
  };

  const handleCreate = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
    setSelectedStaff([]);
    setSelectedJob(null);
    setSelectedEnquiry(null);
    setJobSearch('');
    setNewTitle('');
    setEventType('scheduled_work');
  };

  const handleSaveAppointment = async () => {
    if (!selectedDate) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Validate based on event type
    if (eventType === 'scheduled_work' && !selectedJob) {
      alert('Please select a job for scheduled work');
      return;
    }
    if (eventType === 'measure_quote' && !selectedEnquiry) {
      alert('Please select an enquiry for M&Q appointment');
      return;
    }
    if (eventType === 'admin' && !newTitle) {
      alert('Please enter a title for admin appointment');
      return;
    }

    const scheduleData = {
      user_id: user.id,
      event_type: eventType,
      scheduled_date: selectedDate.toISOString().split('T')[0],
      scheduled_time: selectedDate.toTimeString().slice(0, 8),
      job_id: eventType === 'scheduled_work' ? selectedJob?.id : null,
      enquiry_id: eventType === 'measure_quote' ? selectedEnquiry?.id : null,
      title: eventType === 'admin' ? newTitle : null,
      staff_id: selectedStaff.length > 0 ? selectedStaff[0].id : null,
    };

    const { error } = await supabase
      .from('schedule_events')
      .insert(scheduleData);

    if (error) {
      alert('Error creating appointment: ' + error.message);
      return;
    }

    setShowModal(false);
    setSelectedDate(null);
    setNewTitle('');
    fetchScheduledJobs(); // Refresh the calendar
  };

  return (
    <div className="w-full px-2 py-2">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          {/* Icon Badge */}
          <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-4 h-4 text-pink-600" />
          </div>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Schedule
            </h1>
            <p className="text-xs text-gray-500">
              {(() => {
                const today = new Date();
                const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                return `Week of ${startOfWeek.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;
              })()}
            </p>
          </div>
        </div>
        
        {/* Right: Info or could add action button if needed */}
        <div className="text-sm text-gray-500">
          {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="w-full overflow-x-auto mb-2">
        <div className="bg-white rounded-lg p-1.5 shadow-sm">
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
          <button 
            className={`px-2 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
              scheduleFilter === 'all'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setScheduleFilter('all')}
          >
            All Jobs
          </button>
          <button 
            className={`px-2 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
              scheduleFilter === 'measure_quote'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setScheduleFilter('measure_quote')}
          >
            M&Q
          </button>
          <button 
            className={`px-2 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
              scheduleFilter === 'work'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setScheduleFilter('work')}
          >
            Work
          </button>
          <button 
            className={`px-2 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
              scheduleFilter === 'admin'
                ? 'bg-gray-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setScheduleFilter('admin')}
          >
            Admin
          </button>
        </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[380px] lg:min-w-0">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
            </div>
          }>
            <Calendar appointments={appointments} onCreate={handleCreate} />
          </Suspense>
        </div>
      </div>
      {/* Modern modal for appointment creation */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-lg flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 w-full max-w-sm sm:max-w-lg lg:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">New Appointment</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      eventType === 'scheduled_work'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setEventType('scheduled_work')}
                  >
                    Work
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      eventType === 'measure_quote'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setEventType('measure_quote')}
                  >
                    M&Q
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      eventType === 'admin'
                        ? 'bg-gray-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setEventType('admin')}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input 
                    type="date" 
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} 
                    onChange={e => setSelectedDate(new Date(e.target.value))}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input 
                    type="time" 
                    value={selectedDate ? selectedDate.toTimeString().slice(0,5) : ''} 
                    onChange={e => {
                      if (selectedDate) {
                        const [h, m] = e.target.value.split(':');
                        const newDate = new Date(selectedDate);
                        newDate.setHours(Number(h));
                        newDate.setMinutes(Number(m));
                        setSelectedDate(newDate);
                      }
                    }}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                  />
                </div>
              </div>

              {eventType === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Admin appointment title..."
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                  />
                </div>
              )}

              {eventType === 'scheduled_work' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Job
                  </label>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                  />
                  {jobSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {jobList
                        .filter(job => 
                          job.job_name?.toLowerCase().includes(jobSearch.toLowerCase())
                        )
                        .map(job => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => handleSelectJob(job)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {job.job_name}
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {selectedJob && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Selected: {selectedJob.job_name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {eventType === 'measure_quote' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Enquiry
                  </label>
                  <input
                    type="text"
                    placeholder="Search enquiries..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                  />
                  {jobSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {enquiriesList
                        .filter(enquiry =>
                          enquiry.job_name?.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          enquiry.description?.toLowerCase().includes(jobSearch.toLowerCase())
                        )
                        .map(enquiry => (
                          <button
                            key={enquiry.id}
                            type="button"
                            onClick={() => handleSelectEnquiry(enquiry)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            <div>
                              <p className="font-medium">{enquiry.job_name}</p>
                              {enquiry.description && (
                                <p className="text-sm text-gray-600">{enquiry.description}</p>
                              )}
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {selectedEnquiry && (
                    <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-900">
                        Selected: {selectedEnquiry.job_name}
                        {selectedEnquiry.description && ` - ${selectedEnquiry.description}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAppointment}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Job creation modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-lg flex items-center justify-center p-4 z-50">
          <Suspense fallback={
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: colors.accent.DEFAULT }}></div>
            </div>
          }>
            <JobCreationForm onJobCreated={handleJobCreated} onClose={() => setShowJobModal(false)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
