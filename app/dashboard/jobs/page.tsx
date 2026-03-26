'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { Plus, Search, Eye, Edit, DollarSign, FileText, Calendar, ChevronLeft, ChevronRight, Filter, Briefcase, Camera } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/dates'
import { getJobStatusConfig } from '@/lib/utils/status'
import { useIsMobile } from '@/lib/utils/responsive'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import { ActionButtons } from '@/components/ActionButtons'
import Breadcrumb from '@/components/Breadcrumb'
import { getBusinessId } from '@/lib/business'

type JobWithClient = {
  id: string
  job_number: string
  job_name: string
  street_address: string
  suburb: string
  state: string
  postcode: string
  status: string
  total_amount: number
  start_date: string | null  // Changed from scheduled_date to start_date
  client_id: string
  clients: { name: string; address?: string; street_address?: string; suburb?: string; state?: string; postcode?: string } | null
  created_at: string
  photo_count?: number
}

const ITEMS_PER_PAGE = 50

export default function JobsPageOptimized() {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [jobs, setJobs] = useState<JobWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'complete' | 'cancelled'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchJobs()
  }, [search, statusFilter, currentPage])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found for user')
        setLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('jobs')
        .select(`
          *, 
          clients(name, street_address, suburb, state, postcode),
          photo_count:job_photos(count)
        `, { count: 'exact' })
        .eq('business_id', businessId)

      // Server-side status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.in('status', ['in_progress', 'approved'])
        } else if (statusFilter === 'pending') {
          query = query.in('status', ['enquiry', 'quoted', 'awaiting_approval'])
        } else if (statusFilter === 'complete') {
          query = query.eq('status', 'completed')
        } else if (statusFilter === 'cancelled') {
          query = query.eq('status', 'cancelled')
        }
      }

      // Server-side search
      if (search.trim()) {
        query = query.or(`job_number.ilike.%${search}%,job_name.ilike.%${search}%`)
      }

      // Pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1
      query = query.range(start, end).order('job_number', { ascending: true })

      const { data, count, error } = await query

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
        <div className="bg-white border-b px-4 md:px-8 py-4 md:py-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="p-4 md:p-8">
          <SkeletonTable rows={10} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Jobs', href: '/dashboard/jobs' }]} />

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center shadow-sm">
              <Briefcase className="w-6 h-6 text-gray-600" />
            </div>
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Jobs
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} active {totalCount === 1 ? 'job' : 'jobs'}
              </p>
            </div>
          </div>
          
          {/* Right: Action Button */}
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm mb-3 md:mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job number or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 border rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: colors.border.DEFAULT }}
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              className={`px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => {
                setStatusFilter('active')
                setCurrentPage(1)
              }}
              className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                statusFilter === 'active' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('pending')
                setCurrentPage(1)
              }}
              className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                statusFilter === 'pending' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Pending
            </button>
            <button
              onClick={() => {
                setStatusFilter('complete')
                setCurrentPage(1)
              }}
              className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                statusFilter === 'complete' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Complete
            </button>
            <button
              onClick={() => {
                setStatusFilter('cancelled')
                setCurrentPage(1)
              }}
              className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                statusFilter === 'cancelled' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Cancelled
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {jobs.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-base md:text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                No jobs found
              </p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Job #
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Scheduled
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {jobs.map((job) => {
                        const statusConfig = getJobStatusConfig(job.status as any)
                        return (
                          <tr 
                            key={job.id} 
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-2 py-2 whitespace-nowrap">
                              <Link
                                href={`/dashboard/jobs/${job.id}`}
                                className="text-xs font-medium text-cyan-600 hover:text-cyan-700 font-sans"
                              >
                                {job.job_number}
                              </Link>
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-xs font-medium text-gray-900">{job.clients?.name || 'No client'}</div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-xs text-gray-600">
                                {job.street_address && job.suburb 
                                  ? `${job.street_address}, ${job.suburb}` 
                                  : job.street_address || job.suburb || '-'
                                }
                              </div>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: statusConfig.bg, 
                                  color: statusConfig.text 
                                }}
                              >
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <span className="text-xs text-gray-600">
                                {job.start_date ? formatDate(job.start_date, 'short') : '-'}
                              </span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(job.total_amount || 0)}
                              </span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/dashboard/jobs/${job.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                                  <Eye className="w-3.5 h-3.5 text-gray-600" />
                                </Link>
                                <Link href={`/dashboard/invoices/new?job_id=${job.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Create Invoice">
                                  <DollarSign className="w-3.5 h-3.5 text-gray-600" />
                                </Link>
                                {/* Photo count badge */}
                                {(job.photo_count as any)?.[0]?.count > 0 && (
                                  <Link 
                                    href={`/dashboard/jobs/${job.id}#job-photos`}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                                    title="View Photos"
                                  >
                                    <Camera className="w-3 h-3" />
                                    {(job.photo_count as any)[0].count}
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <div className="mobile-cards p-4 space-y-4">
                  {jobs.map((job) => {
                    const statusConfig = getJobStatusConfig(job.status as any)
                    return (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 space-y-3"
                        style={{ borderColor: colors.border.DEFAULT }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="text-sm font-bold hover:underline block mb-1"
                              style={{ color: colors.primary.DEFAULT }}
                            >
                              {job.job_number}
                            </Link>
                            <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                              {job.clients?.name || 'No client'}
                            </p>
                            {(job.street_address || job.suburb) && (
                              <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
                                {job.street_address && job.suburb 
                                  ? `${job.street_address}, ${job.suburb}` 
                                  : job.street_address || job.suburb
                                }
                              </p>
                            )}
                            <div className="text-xs" style={{ color: colors.text.muted }}>
                              {/* Display client address only */}
                              {job.clients?.street_address || job.clients?.suburb || job.clients?.state || job.clients?.postcode ? (
                                <div>
                                  {job.clients.street_address && <div>{job.clients.street_address}</div>}
                                  {(job.clients.suburb || job.clients.state || job.clients.postcode) && (
                                    <div>
                                      {[job.clients.suburb, job.clients.state, job.clients.postcode].filter(Boolean).join(' ')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                'No address'
                              )}
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span style={{ color: colors.text.secondary }}>Scheduled: </span>
                            <span className="font-medium" style={{ color: colors.text.primary }}>
                              {job.start_date ? formatDate(job.start_date, 'short') : 'Not scheduled'}
                            </span>
                          </div>
                          <div className="font-bold" style={{ color: colors.text.primary }}>
                            {formatCurrency(job.total_amount || 0)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: colors.border.DEFAULT }}>
                          <button
                            onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                            className="flex-1 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                            style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/jobs/edit/${job.id}`)}
                            className="flex-1 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                            style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm" style={{ color: colors.text.secondary }}>
              Page {currentPage} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
