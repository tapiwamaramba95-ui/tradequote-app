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
  DollarSign,
  Eye,
  Edit,
  Send,
  FileText
} from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/format'
import { getInvoiceDisplayStatus, getInvoiceStatusConfig, getInvoiceDateInfo } from '@/lib/invoice-status'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import Breadcrumb from '@/components/Breadcrumb'
import { getBusinessId } from '@/lib/business'

type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  amount_paid: number
  status: 'draft' | 'sent'
  payment_status: 'unpaid' | 'partial' | 'paid'
  created_at: string
  paid_at: string | null
  issue_date?: string
  job_id: string | null
  jobs: {
    id: string
    job_number: string
    title: string
    invoiced_amount: number
    clients: {
      name: string
    }
  } | null
}

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [search, statusFilter, page])

  const fetchInvoices = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found for user')
        return
      }

      let query = supabase
        .from('invoices')
        .select(`
          *,
          jobs!job_id (
            id,
            job_number,
            title,
            invoiced_amount,
            clients!client_id (name)
          )
        `, { count: 'exact' })
        .eq('business_id', businessId)

      if (statusFilter !== 'all') {
        // Filter by display status logic
        if (statusFilter === 'draft') {
          query = query.eq('status', 'draft')
        } else if (statusFilter === 'paid') {
          query = query.eq('payment_status', 'paid')
        } else if (statusFilter === 'partially_paid') {
          query = query.eq('payment_status', 'partial')
        } else if (statusFilter === 'awaiting_payment') {
          query = query.eq('status', 'sent').eq('payment_status', 'unpaid').gte('due_date', new Date().toISOString())
        } else if (statusFilter === 'overdue') {
          query = query.eq('status', 'sent').eq('payment_status', 'unpaid').lt('due_date', new Date().toISOString())
        }
      }

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%`)
      }

      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) {
        console.error('Error fetching invoices:', error)
        
        // Try to auto-migrate invoices without business_id
        console.log('Attempting to migrate invoices without business_id...')
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ business_id: businessId })
          .is('business_id', null)
        
        if (updateError) {
          console.error('Migration failed:', updateError)
        } else {
          console.log('Migration successful, retrying fetch...')
          // Retry the query after migration
          const { data: retryData, error: retryError, count: retryCount } = await query
            .order('created_at', { ascending: false })
            .range(start, end)
          
          if (!retryError) {
            setInvoices(retryData || [])
            setTotalCount(retryCount || 0)
            setHasMore((retryCount || 0) > (page + 1) * PAGE_SIZE)
            setLoading(false)
            return
          }
        }
        throw error
      }

      setInvoices(data || [])
      setTotalCount(count || 0)
      setHasMore((count || 0) > (page + 1) * PAGE_SIZE)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching invoices:', err)
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

  // Removed getDaysOverdue - now handled by getInvoiceDateInfo

  if (loading && page === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-8 py-6">
          <Breadcrumb items={[{ label: 'Invoices' }]} />
          <SkeletonTable rows={10} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Invoices', href: '/dashboard/invoices' }]} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoices
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} {totalCount === 1 ? 'invoice' : 'invoices'} • Manage your invoices and payments
              </p>
            </div>
          </div>
          
          {/* Right: Action Button */}
          <Link 
            href="/dashboard/invoices/new" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all w-full sm:w-auto"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search invoices..." 
                value={search} 
                onChange={e => handleSearchChange(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  color: colors.text.primary 
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.accent.DEFAULT
                  e.target.style.boxShadow = `0 0 0 2px rgba(234, 88, 12, 0.2)`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select value={statusFilter} onChange={e => handleStatusFilterChange(e.target.value)} className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                <option value="all">All Invoices</option>
                <option value="draft">Draft</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="overdue">Overdue</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">{totalCount} {totalCount === 1 ? 'invoice' : 'invoices'}</div>
          </div>
        </div>

        <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Info</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const displayStatus = getInvoiceDisplayStatus(invoice)
                const statusConfig = getInvoiceStatusConfig(displayStatus)
                const dateInfo = getInvoiceDateInfo(invoice)
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Link href={`/dashboard/invoices/${invoice.id}`} className="text-xs font-medium text-orange-600 hover:text-orange-700 font-sans">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-xs font-medium text-gray-900 truncate">{invoice.jobs?.clients?.name || 'No client'}</div>
                    </td>
                    <td className="px-2 py-2">
                      {invoice.jobs?.id && invoice.jobs?.job_number ? (
                        <Link
                          href={`/dashboard/jobs/${invoice.jobs.id}`}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {invoice.jobs.job_number}
                        </Link>
                      ) : (
                        <div className="text-xs text-gray-600">-</div>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <div className="text-xs font-medium text-gray-900">{formatCurrency(invoice.jobs?.invoiced_amount || 0)}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                        {statusConfig.icon && <span>{statusConfig.icon}</span>}
                        <span>{statusConfig.label}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-xs text-gray-600">{dateInfo}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                        {invoice.payment_status !== 'paid' && (
                          <Link href={`/dashboard/invoices/edit/${invoice.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {totalCount > PAGE_SIZE && (
            <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}</div>
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

        <div className="lg:hidden space-y-3">
          {invoices.map((invoice) => {
            const displayStatus = getInvoiceDisplayStatus(invoice)
            const statusConfig = getInvoiceStatusConfig(displayStatus)
            const dateInfo = getInvoiceDateInfo(invoice)
            return (
              <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1 font-sans">{invoice.invoice_number}</div>
                    <div className="font-semibold text-gray-900 mb-1">{invoice.jobs?.clients?.name || 'No client'}</div>
                    {invoice.jobs?.id && invoice.jobs?.job_number ? (
                      <Link
                        href={`/dashboard/jobs/${invoice.jobs.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {invoice.jobs.job_number}
                      </Link>
                    ) : (
                      <div className="text-sm text-gray-600">No job</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                      {statusConfig.icon && <span>{statusConfig.icon}</span>}
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{formatCurrency(invoice.jobs?.invoiced_amount || 0)}</div>
                <div className="text-sm text-gray-500 mb-3">{dateInfo}</div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  {invoice.payment_status !== 'paid' && (
                    <Link 
                      href={`/dashboard/invoices/edit/${invoice.id}`} 
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                      style={{ backgroundColor: colors.accent.DEFAULT }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {!loading && invoices.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No invoices found</h3>
            <p className="text-sm text-gray-500 mb-6">{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first invoice'}</p>
            {!search && statusFilter === 'all' && (
              <Link 
                href="/dashboard/invoices/new" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: colors.accent.DEFAULT }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
              >
                <Plus className="w-4 h-4" />
                Create First Invoice
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
