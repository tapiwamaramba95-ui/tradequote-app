'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { Job, Quote, JobAppointment } from '@/lib/types'
import PhotoUpload from '@/components/PhotoUpload'
import PhotoGallery from '@/components/PhotoGallery'
import CompleteJobModal from '@/components/CompleteJobModal'
import Breadcrumb from '@/components/Breadcrumb'
import { Camera, Briefcase } from 'lucide-react'
import { getBusinessId } from '@/lib/business'

interface Invoice {
  id: string
  invoice_number: string
  total: number
  status: string
  created_at: string
}

interface JobWithClient extends Job {
  client: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [job, setJob] = useState<JobWithClient | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [appointments, setAppointments] = useState<JobAppointment[]>([])
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Staff management
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [editingInfo, setEditingInfo] = useState(false)
  const [editedJobNumber, setEditedJobNumber] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  
  // Photo management
  const [photoCount, setPhotoCount] = useState(0)
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  // Helper functions for timesheet display
  const getInitials = (userName: string, userId?: string) => {
    if (!userName || userName === 'Unknown User') {
      return 'U'
    }
    const names = userName.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return userName.substring(0, 2).toUpperCase()
  }

  const avatarColors = [
    '#EA580C', // orange
    '#0EA5E9', // blue
    '#8B5CF6', // purple
    '#10B981', // green
    '#F59E0B', // amber
  ]

  const getAvatarColor = (userId: string) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatarColors[hash % avatarColors.length]
  }

  const formatTime12Hour = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getUserName = (entry: any) => {
    // Get name from joined staff table
    if (entry.staff?.name) {
      return entry.staff.name
    }
    return 'Unknown User'
  }

  useEffect(() => {
    loadJobData()
  }, [id])

  const loadJobData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Parallelize all queries
      const [
        jobResult,
        quotesResult,
        invoicesResult,
        appointmentsResult,        generalAppointmentsResult,        timesheetsResult,
        staffResult,
        photoResult
      ] = await Promise.all([
        // Load job
        supabase
          .from('jobs')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('id', id)
          .single(),
        
        // Load quotes
        supabase
          .from('quotes')
          .select('*')
          .eq('job_id', id)
          .order('quote_version', { ascending: false }),
        
        // Load invoices
        supabase
          .from('invoices')
          .select('id, invoice_number, total, status, created_at')
          .eq('job_id', id)
          .order('created_at', { ascending: false }),
        
        // Load appointments (from both job_appointments and appointments tables)
        supabase
          .from('job_appointments')
          .select('*')
          .eq('job_id', id)
          .order('scheduled_date'),
        
        // Load general appointments for this job
        supabase
          .from('appointments')
          .select('*')
          .eq('job_id', id)
          .order('start_time', { ascending: true }),
        
        // Load timesheets with staff information
        supabase
          .from('timesheets')
          .select('*, staff:staff_id(name)')
          .eq('job_id', id)
          .not('end_time', 'is', null)
          .order('date', { ascending: false }),
        
        // Load staff members
        user ? (async () => {
          const businessId = await getBusinessId();
          if (!businessId) return { data: null };
          return supabase
            .from('staff')
            .select('*')
            .eq('business_id', businessId)
            .order('first_name');
        })() : Promise.resolve({ data: null }),
        
        // Load photo count
        supabase
          .from('job_photos')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', id)
      ])

      console.log('All query results:', { 
        job: !!jobResult.data, 
        quotes: quotesResult.data?.length,
        invoices: invoicesResult.data?.length,
        timesheets: timesheetsResult.data?.length,
        timesheetsError: timesheetsResult.error 
      })

      if (jobResult.data) setJob(jobResult.data as JobWithClient)
      if (quotesResult.data) setQuotes(quotesResult.data)
      if (invoicesResult.data) setInvoices(invoicesResult.data)
      
      // Combine appointments from both tables
      const allAppointments = [
        ...(appointmentsResult.data || []),
        ...(generalAppointmentsResult.data || []).map((apt: any) => ({
          id: apt.id,
          job_id: apt.job_id,
          appointment_type: apt.description?.includes('Measure') ? 'measure_quote' : 'work',
          scheduled_date: apt.start_time,
          duration_minutes: Math.round((new Date(apt.end_time).getTime() - new Date(apt.start_time).getTime()) / 60000),
          notes: apt.description,
          status: apt.status,
          created_at: apt.created_at,
        }))
      ];
      setAppointments(allAppointments)
      
      console.log('Timesheets query result:', timesheetsResult)
      console.log('Timesheets data:', timesheetsResult.data)
      console.log('Timesheets count:', timesheetsResult.data?.length)
      if (timesheetsResult.data) setTimesheets(timesheetsResult.data)
      if (staffResult.data) setStaffMembers(staffResult.data)
      setPhotoCount(photoResult.count || 0)

    } catch (error) {
      console.error('Error loading job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJobInfo = async () => {
    try {
      const updates: any = {}
      if (editedJobNumber && editedJobNumber !== job?.job_number) {
        updates.job_number = editedJobNumber
      }
      if (selectedStaffId) {
        updates.staff_member_id = selectedStaffId
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('jobs')
          .update(updates)
          .eq('id', id)

        if (error) throw error

        await loadJobData()
        setEditingInfo(false)
        alert('Job info updated successfully!')
      } else {
        setEditingInfo(false)
      }
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job info')
    }
  }

  const handleMarkQuoteAccepted = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_accepted: true })
        .eq('id', quoteId)

      if (error) throw error

      // Reload job data
      await loadJobData()
      alert('Quote marked as accepted! Job status updated.')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to mark quote as accepted')
    }
  }

  const handleMarkComplete = () => {
    setShowCompleteModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Job not found
          </h1>
          <button
            onClick={() => router.push('/dashboard/jobs')}
            className="px-6 py-3 border-2 rounded-lg font-semibold"
            style={{ borderColor: colors.border.DEFAULT }}
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enquiry': return { bg: '#f3f4f6', text: '#6b7280' }
      case 'quoted': return { bg: '#dbeafe', text: '#1e40af' }
      case 'approved': return { bg: '#d1fae5', text: '#065f46' }
      case 'in_progress': return { bg: '#fef3c7', text: '#92400e' }
      case 'completed': return { bg: '#dcfce7', text: '#16a34a' }
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' }
      default: return { bg: '#f3f4f6', text: '#6b7280' }
    }
  }

  const statusColors = getStatusColor(job.status)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* Page Header */}
      <div className="bg-white border-b px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center shadow-sm">
              <Briefcase className="w-6 h-6 text-gray-600" />
            </div>
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {job.client?.name || 'Job Details'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {job.job_number || `Job ${job.id.slice(0, 8)}`}
              </p>
            </div>
          </div>
          
          {/* Right: Back Button */}
          <button
            onClick={() => router.push('/dashboard/jobs')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Jobs', href: '/dashboard/jobs' },
          { label: job.job_number || 'Job Details' }
        ]} />

        {/* Job Status & Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
              <span
                className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold capitalize"
                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
              >
                {job.status.replace('_', ' ')}
              </span>
              {job.status === 'enquiry' && job.enquiry_number && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                    </svg>
                    {job.enquiry_number}
                  </span>
                </div>
              )}
            </div>

            {/* Client & Address */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Client</label>
              <p className="text-sm font-semibold text-gray-900">{job.client?.name || 'No client'}</p>
              <p className="text-sm text-gray-600 mt-1">{job.job_address}</p>
            </div>

            {/* Source */}
            {job.enquiry_source && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Source</label>
                <p className="text-sm text-gray-900 capitalize">{job.enquiry_source.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>

      {/* Customer Request Section - Show if description exists */}
      {job.description && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Customer's Original Request
                </h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-800 text-xs font-semibold rounded">
                  From Enquiry
                </span>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
              
              <p className="text-xs text-gray-700 mt-2">
                💡 This is what the customer originally requested. Update job details below as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Job Photos Section */}
      <div id="job-photos" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Job Photos</h2>
                <p className="text-sm text-gray-500">Document your work with before, during, and after photos</p>
              </div>
            </div>
            
            {/* Photo count badge */}
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Section */}
          <div className="mb-6">
            <PhotoUpload 
              jobId={job.id} 
              onUploadComplete={loadJobData}
              photoType="during"
              maxPhotos={50}
            />
          </div>

          {/* Photo Gallery */}
          <PhotoGallery jobId={job.id} editable={true} />
        </div>
      </div>

      {/* Job Info Card - Job Number & Staff */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            Job Information
          </h2>
          {!editingInfo && (
            <button
              onClick={() => {
                setEditingInfo(true)
                setEditedJobNumber(job.job_number || '')
                setSelectedStaffId(job.staff_member_id || '')
              }}
              className="text-sm px-3 py-1 rounded border-2"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              ✏️ Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Job Number */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
              Job Number
            </label>
            {editingInfo ? (
              <input
                type="text"
                value={editedJobNumber}
                onChange={(e) => setEditedJobNumber(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="e.g., JOB-0001"
              />
            ) : (
              <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                {job.job_number || 'Not set'}
              </p>
            )}
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
              Assigned Staff
            </label>
            {editingInfo ? (
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <option value="">Unassigned</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                {staffMembers.find(s => s.id === job.staff_member_id)?.first_name 
                  ? `${staffMembers.find(s => s.id === job.staff_member_id)?.first_name} ${staffMembers.find(s => s.id === job.staff_member_id)?.last_name}`
                  : 'Unassigned'}
              </p>
            )}
          </div>
        </div>

        {editingInfo && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSaveJobInfo}
              className="px-4 py-2 text-white rounded-lg font-semibold"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditingInfo(false)}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Based on Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {job.status === 'enquiry' && (
            <>
              <Link
                href={`/dashboard/schedule?job_id=${job.id}&type=measure_quote`}
                className="px-4 py-2 text-white rounded-lg font-semibold"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                📅 Schedule
              </Link>
              <Link
                href={`/dashboard/quotes/new?job_id=${job.id}`}
                className="px-4 py-2 border-2 rounded-lg font-semibold"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                💰 Create Quote
              </Link>
            </>
          )}
          
          {job.status === 'quoted' && quotes.length > 0 && (
            <>
              <button
                onClick={() => handleMarkQuoteAccepted(quotes[0].id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold"
              >
                ✅ Mark Quote Accepted
              </button>
              <Link
                href={`/dashboard/quotes/new?job_id=${job.id}`}
                className="px-4 py-2 border-2 rounded-lg font-semibold"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                📝 Create Revised Quote
              </Link>
            </>
          )}
          
          {(job.status === 'approved' || job.status === 'in_progress') && (
            <>
              <Link
                href={`/dashboard/schedule?job_id=${job.id}&type=work`}
                className="px-4 py-2 text-white rounded-lg font-semibold"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                📅 Schedule Work
              </Link>
              <Link
                href={`/dashboard/timesheets?job_id=${job.id}&auto_clock_in=true`}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold"
              >
                🕐 Clock In
              </Link>
              <Link
                href={`/dashboard/invoices/new?job_id=${job.id}`}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold"
              >
                📄 Create Invoice
              </Link>
            </>
          )}
          
          {job.status === 'in_progress' && (
            <button
              onClick={handleMarkComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
            >
              ✅ Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
            Quoted
          </div>
          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            ${job.quoted_amount?.toLocaleString('en-AU', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
            Invoiced
          </div>
          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            ${job.invoiced_amount?.toLocaleString('en-AU', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
            Total Cost
          </div>
          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            ${job.total_cost?.toLocaleString('en-AU', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
            Materials: ${job.total_material_cost?.toFixed(2) || '0.00'}<br />
            Labour: ${job.total_labour_cost?.toFixed(2) || '0.00'}<br />
            M&Q (CAC): ${job.total_acquisition_cost?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
            Profit
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: (job.gross_profit || 0) >= 0 ? colors.accent.DEFAULT : '#ef4444' }}
          >
            ${job.gross_profit?.toLocaleString('en-AU', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            {job.margin?.toFixed(1) || '0.0'}% margin
          </div>
        </div>
      </div>

      {/* Quotes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Quotes ({quotes.length})
          </h2>
          <Link
            href={`/dashboard/quotes/new?job_id=${job.id}`}
            className="px-4 py-2 text-sm font-semibold"
            style={{ color: colors.accent.DEFAULT }}
          >
            + New Quote
          </Link>
        </div>
        {quotes.length === 0 ? (
          <p style={{ color: colors.text.secondary }}>No quotes yet</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-4 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <div>
                  <div className="font-semibold" style={{ color: colors.text.primary }}>
                    {quote.quote_number} (v{quote.quote_version})
                  </div>
                  <div className="text-sm" style={{ color: colors.text.secondary }}>
                    ${quote.total?.toLocaleString('en-AU', { minimumFractionDigits: 2 }) || '0.00'}
                    {quote.is_accepted && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                        ACCEPTED
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="px-4 py-2 border-2 rounded-lg text-sm font-semibold"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Invoices ({invoices.length})
          </h2>
          <Link
            href={`/dashboard/invoices/new?job_id=${job.id}`}
            className="px-4 py-2 text-sm font-semibold"
            style={{ color: colors.accent.DEFAULT }}
          >
            + New Invoice
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p style={{ color: colors.text.secondary }}>No invoices yet</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <div>
                  <div className="font-semibold" style={{ color: colors.text.primary }}>
                    {invoice.invoice_number}
                  </div>
                  <div className="text-sm" style={{ color: colors.text.secondary }}>
                    ${invoice.total?.toLocaleString('en-AU', { minimumFractionDigits: 2 })} • {invoice.status}
                  </div>
                </div>
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="px-4 py-2 border-2 rounded-lg text-sm font-semibold"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Appointments ({appointments.length})
          </h2>
        </div>
        {appointments.length === 0 ? (
          <p style={{ color: colors.text.secondary }}>No appointments scheduled</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 border-2 rounded-lg"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold capitalize" style={{ color: colors.text.primary }}>
                      {apt.appointment_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                      {new Date(apt.scheduled_date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {apt.notes && (
                      <div className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                        {apt.notes}
                      </div>
                    )}
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: apt.status === 'completed' ? '#dcfce7' : '#fef3c7',
                      color: apt.status === 'completed' ? '#16a34a' : '#92400e'
                    }}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timesheets - Modern Card Layout */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        {timesheets.length === 0 ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Time logged
            </h2>
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No time logged yet</p>
              <Link
                href={`/dashboard/timesheets?job_id=${job.id}`}
                className="w-full inline-block py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-orange-600 hover:bg-gray-50 transition-colors"
              >
                + Add time entry
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Header with totals */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Time logged
              </h2>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-600 mb-1">Total hours</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {timesheets.reduce((sum, entry) => sum + (entry.hours || 0), 0).toFixed(1)}h
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-600 mb-1">Total value</div>
                  <div className="text-xl font-semibold text-green-600">
                    ${timesheets.reduce((sum, entry) => 
                      sum + ((entry.hours || 0) * (entry.hourly_rate || 0)), 0
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Time entries */}
            <div className="space-y-0">
              {timesheets.slice(0, 5).map((entry: any, index: number) => {
                const userName = getUserName(entry)
                const initials = getInitials(userName, entry.user_id)
                const avatarColor = getAvatarColor(entry.user_id || entry.id)
                
                return (
                  <div
                    key={entry.id}
                    className={`py-3 flex justify-between gap-3 ${
                      index > 0 ? 'border-t border-gray-200' : ''
                    }`}
                  >
                    {/* Left: Avatar + Details */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 text-gray-900">
                          {userName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateLong(entry.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime12Hour(entry.start_time)} - {formatTime12Hour(entry.end_time)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Hours + Value */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="font-medium text-gray-900">
                        {(entry.hours || 0).toFixed(2)}h
                      </div>
                      <div className="font-medium text-gray-900 min-w-[70px] text-right">
                        ${((entry.hours || 0) * (entry.hourly_rate || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* View all link or Add button */}
            {timesheets.length > 5 ? (
              <div className="text-center pt-4 border-t border-gray-200 mt-3">
                <Link
                  href={`/dashboard/timesheets?job_id=${job.id}`}
                  className="text-sm font-semibold"
                  style={{ color: colors.accent.DEFAULT }}
                >
                  View all {timesheets.length} entries →
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <Link
                  href={`/dashboard/timesheets?job_id=${job.id}`}
                  className="w-full block py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-orange-600 hover:bg-gray-50 transition-colors text-center"
                >
                  + Add time entry
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB for quick photo upload */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => {
            // Scroll to photo section
            document.getElementById('job-photos')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Complete Job Modal */}
      {showCompleteModal && (
        <CompleteJobModal
          jobId={job.id}
          jobNumber={job.job_number}
          onClose={() => setShowCompleteModal(false)}
          onComplete={() => {
            setShowCompleteModal(false)
            // Refresh job data
            loadJobData()
          }}
        />
      )}
      </div>
    </div>
  )
}