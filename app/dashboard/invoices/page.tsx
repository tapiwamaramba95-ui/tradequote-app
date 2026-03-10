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
import { getInvoiceStatusConfig } from '@/lib/utils/status'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import Breadcrumb from '@/components/Breadcrumb'

type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total: number
  amount_paid: number
  status: string
  jobs: {
    job_name: string
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

      let query = supabase
        .from('invoices')
        .select(`
          *,
          jobs!job_id (
            job_name,
            clients!client_id (name)
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%`)
      }

      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

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

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status !== 'overdue') return null
    const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : null
  }

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
        <div className="flex items-center justify-between mb-6">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
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
                  focusRingColor: colors.accent.DEFAULT,
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
              <select value={statusFilter} onChange={e => handleStatusFilterChange(e.target.value)} className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all">
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">{totalCount} {totalCount === 1 ? 'invoice' : 'invoices'}</div>
          </div>
        </div>

        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const statusConfig = getInvoiceStatusConfig(invoice.status as any)
                const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status)
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/invoices/${invoice.id}`} className="text-sm font-medium text-cyan-600 hover:text-cyan-700 font-sans">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{invoice.jobs?.clients?.name || 'No client'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{invoice.jobs?.job_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                        {statusConfig.label}
                      </span>
                      {daysOverdue && <div className="text-xs text-red-600 mt-1">{daysOverdue} days overdue</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                      {invoice.amount_paid > 0 && <div className="text-xs text-gray-500">{formatCurrency(invoice.amount_paid)} paid</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">{formatDate(invoice.due_date)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                        {invoice.status !== 'paid' && (
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
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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

        <div className="md:hidden space-y-3">
          {invoices.map((invoice) => {
            const statusConfig = getInvoiceStatusConfig(invoice.status as any)
            const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status)
            return (
              <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1 font-sans">{invoice.invoice_number}</div>
                    <div className="font-semibold text-gray-900 mb-1">{invoice.jobs?.clients?.name || 'No client'}</div>
                    <div className="text-sm text-gray-600">{invoice.jobs?.job_name || 'No job'}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}>
                      {statusConfig.label}
                    </span>
                    {daysOverdue && <div className="text-xs text-red-600 mt-1">{daysOverdue} days overdue</div>}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{formatCurrency(invoice.total)}</div>
                {invoice.amount_paid > 0 && <div className="text-sm text-gray-500 mb-3">{formatCurrency(invoice.amount_paid)} paid</div>}
                <div className="text-xs text-gray-500 mb-3">Due {formatDate(invoice.due_date)}</div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  {invoice.status !== 'paid' && (
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
