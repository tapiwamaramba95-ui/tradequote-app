'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FileText,
  Eye,
  Edit,
  Send
} from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/format'
import { getQuoteStatusConfig } from '@/lib/utils/status'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import Breadcrumb from '@/components/Breadcrumb'

type Quote = {
  id: string
  quote_number: string
  status: string
  total: number
  created_at: string
  valid_until: string | null
  client_id: string | null
  job_id: string | null
  clients: {
    id: string
    name: string
    email: string
  } | null
  jobs: {
    id: string
    job_number: string
    clients: {
      id: string
      name: string
    } | null
  } | null
}

const PAGE_SIZE = 50

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchQuotes()
  }, [search, statusFilter, page])

  const fetchQuotes = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('quotes')
        .select(`
          *,
          clients (id, name, email),
          jobs (
            id,
            job_number,
            clients (id, name)
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)

      // Server-side filtering
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Server-side search
      if (search) {
        query = query.or(`quote_number.ilike.%${search}%`)
      }

      // Pagination
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      setQuotes(data || [])
      setTotalCount(count || 0)
      setHasMore((count || 0) > (page + 1) * PAGE_SIZE)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching quotes:', err)
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  const getClientName = (quote: Quote) => {
    if (quote.clients) return quote.clients.name
    if (quote.jobs?.clients) return quote.jobs.clients.name
    return 'No client'
  }

  if (loading && page === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-8 py-6">
          <Breadcrumb items={[{ label: 'Quotes' }]} />
          <SkeletonTable rows={10} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Quotes', href: '/dashboard/quotes' }]} />

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center shadow-sm">
              <FileEdit className="w-6 h-6 text-purple-600" />
            </div>
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quotes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} active {totalCount === 1 ? 'quote' : 'quotes'} • Manage your quotes and estimates
              </p>
            </div>
          </div>
          
          {/* Right: Action Button */}
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            New Quote
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={e => handleStatusFilterChange(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div className="text-sm text-gray-500 whitespace-nowrap">
              {totalCount} {totalCount === 1 ? 'quote' : 'quotes'}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden xl:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <colgroup>
                <col className="w-24 min-w-24" />
                <col className="w-32 min-w-32" />
                <col className="w-32 min-w-32" />
                <col className="w-24 min-w-24" />
                <col className="w-28 min-w-28" />
                <col className="w-24 min-w-24" />
                <col className="w-28 min-w-28" />
                <col className="w-20 min-w-20" />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Quote #</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Job</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Created</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Valid Until</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((quote) => {
                const statusConfig = getQuoteStatusConfig(quote.status as any)
                return (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="text-xs font-medium text-cyan-600 hover:text-cyan-700 font-sans">
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-xs font-medium text-gray-900 truncate max-w-32">{getClientName(quote)}</div>
                    </td>
                    <td className="px-2 py-2">
                      {quote.jobs?.id && quote.jobs?.job_number ? (
                        <Link
                          href={`/dashboard/jobs/${quote.jobs.id}`}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium truncate max-w-32 block"
                        >
                          {quote.jobs.job_number}
                        </Link>
                      ) : (
                        <div className="text-xs text-gray-600 truncate max-w-32">-</div>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <span className="text-xs font-medium text-gray-900">{formatCurrency(quote.total)}</span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="text-xs text-gray-600">{formatDate(quote.created_at)}</span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="text-xs text-gray-600">{quote.valid_until ? formatDate(quote.valid_until) : '-'}</span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/quotes/${quote.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                        <Link href={`/dashboard/quotes/edit/${quote.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 px-4">Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tablet Table - Simplified */}
        <div className="hidden md:block xl:hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Quote #</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((quote) => {
                  const statusConfig = getQuoteStatusConfig(quote.status as any)
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <Link href={`/dashboard/quotes/${quote.id}`} className="text-xs font-medium text-cyan-600 hover:text-cyan-700 font-sans">
                          {quote.quote_number}
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-900">{getClientName(quote)}</div>
                        {quote.jobs?.id && quote.jobs?.job_number && (
                          <Link
                            href={`/dashboard/jobs/${quote.jobs.id}`}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            {quote.jobs.job_number}
                          </Link>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-right">
                        <span className="text-xs font-medium text-gray-900">{formatCurrency(quote.total)}</span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/dashboard/quotes/${quote.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                          </Link>
                          <Link href={`/dashboard/quotes/edit/${quote.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination for tablet */}
          {totalCount > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 px-4">Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {quotes.map((quote) => {
            const statusConfig = getQuoteStatusConfig(quote.status as any)
            return (
              <div key={quote.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1 font-sans">{quote.quote_number}</div>
                    <div className="font-semibold text-gray-900 mb-1">{getClientName(quote)}</div>
                    {quote.jobs?.id && quote.jobs?.job_number ? (
                      <Link
                        href={`/dashboard/jobs/${quote.jobs.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {quote.jobs.job_number}
                      </Link>
                    ) : (
                      <div className="text-sm text-gray-600">No job</div>
                    )}
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-3">{formatCurrency(quote.total)}</div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Created {formatDate(quote.created_at)}</span>
                  {quote.valid_until && <span>Valid until {formatDate(quote.valid_until)}</span>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/quotes/${quote.id}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link href={`/dashboard/quotes/edit/${quote.id}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {!loading && quotes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No quotes found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first quote'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/dashboard/quotes/new" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors">
                <Plus className="w-4 h-4" />
                Create First Quote
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
