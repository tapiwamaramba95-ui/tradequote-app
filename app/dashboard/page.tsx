'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { 
  AlertCircle, 
  Calendar, 
  DollarSign,
  Clock,
  FileText,
  Plus,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { DashboardStats, ActionItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/dates'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { ActionButtons } from '@/components/ActionButtons'
import WelcomeBanner from '@/components/WelcomeBanner'
import OnboardingChecklist from '@/components/OnboardingChecklist'

type TodaysJob = {
  id: string
  job_number: string
  job_name: string
  scheduled_date: string
  client: { name: string } | null
}

export default function DashboardPage() {
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [todaysJobs, setTodaysJobs] = useState<TodaysJob[]>([])
  const [loading, setLoading] = useState(true)
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'warning' | 'info'>('urgent')

  useEffect(() => {
    loadDashboard()
    
    // Real-time subscription
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => loadDashboard())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [statsResult, actionsResult, jobsResult] = await Promise.all([
        loadStats(user.id),
        loadActionItems(user.id),
        loadTodaysJobs(user.id),
      ])

      if (statsResult) setStats(statsResult)
      if (actionsResult) setActionItems(actionsResult)
      if (jobsResult) setTodaysJobs(jobsResult)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const loadStats = async (userId: string): Promise<DashboardStats | null> => {
    // Optimized: Single aggregation query instead of 10 separate queries
    const [invoicesResult, quotesResult, posResult, jobsResult] = await Promise.all([
      supabase.from('invoices').select('status, total').eq('user_id', userId),
      supabase.from('quotes').select('status, valid_until').eq('user_id', userId),
      supabase.from('purchase_orders').select('status').eq('user_id', userId),
      supabase.from('jobs').select('scheduled_date').eq('user_id', userId)
    ])

    const invoices = invoicesResult.data || []
    const quotes = quotesResult.data || []
    const pos = posResult.data || []
    const jobs = jobsResult.data || []

    const today = new Date().toISOString().split('T')[0]
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return {
      outstanding_revenue: invoices.filter(i => ['unpaid', 'overdue'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0),
      unpaid_invoice_count: invoices.filter(i => ['unpaid', 'overdue'].includes(i.status)).length,
      jobs_today: jobs.filter(j => j.scheduled_date && j.scheduled_date.startsWith(today)).length,
      overdue_invoices_count: invoices.filter(i => i.status === 'overdue').length,
      expiring_quotes_count: quotes.filter(q => q.status === 'sent' && q.valid_until && q.valid_until >= new Date().toISOString() && q.valid_until <= oneWeekFromNow).length,
      invoices_draft: invoices.filter(i => i.status === 'draft').length,
      invoices_unpaid: invoices.filter(i => i.status === 'unpaid').length,
      invoices_overdue: invoices.filter(i => i.status === 'overdue').length,
      invoices_paid: invoices.filter(i => i.status === 'paid').length,
      quotes_draft: quotes.filter(q => q.status === 'draft').length,
      quotes_sent: quotes.filter(q => q.status === 'sent').length,
      quotes_accepted: quotes.filter(q => q.status === 'accepted').length,
      quotes_declined: quotes.filter(q => q.status === 'declined').length,
      pos_draft: pos.filter(p => p.status === 'draft').length,
      pos_unbilled: pos.filter(p => p.status === 'ordered').length,
      pos_billed: pos.filter(p => p.status === 'billed').length,
      last_updated: new Date().toISOString()
    }
  }

  const loadActionItems = async (userId: string): Promise<ActionItem[]> => {
    const items: ActionItem[] = []

    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, jobs!inner(job_name, clients!inner(name))')
      .eq('user_id', userId)
      .eq('status', 'overdue')
      .order('due_date')
      .limit(5)

    overdueInvoices?.forEach(inv => {
      const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)
      const clientName = (inv.jobs as any)?.clients?.name || 'Unknown client'
      items.push({
        id: inv.id,
        type: 'invoice',
        urgency: 'urgent',
        title: `Invoice ${inv.invoice_number} overdue`,
        subtitle: `${clientName} • ${daysOverdue} days overdue`,
        amount: inv.total,
        entityId: inv.id,
        daysOverdue,
      })
    })

    const { data: expiringQuotes } = await supabase
      .from('quotes')
      .select('id, quote_number, total, valid_until, jobs!inner(job_name, clients!inner(name))')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('valid_until', new Date().toISOString())
      .lte('valid_until', new Date(Date.now() + 7 * 86400000).toISOString())
      .order('valid_until')
      .limit(5)

    expiringQuotes?.forEach(quote => {
      const daysUntilExpiry = Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / 86400000)
      const clientName = (quote.jobs as any)?.clients?.name || 'Unknown client'
      items.push({
        id: quote.id,
        type: 'quote',
        urgency: 'warning',
        title: `Quote ${quote.quote_number} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
        subtitle: clientName,
        amount: quote.total,
        entityId: quote.id,
      })
    })

    const { data: unscheduledJobs } = await supabase
      .from('jobs')
      .select('id, job_number, job_name, clients!inner(name)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .is('scheduled_date', null)
      .limit(5)

    unscheduledJobs?.forEach(job => {
      const clientName = (job.clients as any)?.name || 'Unknown client'
      items.push({
        id: job.id,
        type: 'job',
        urgency: 'info',
        title: `Schedule job ${job.job_number}`,
        subtitle: `${clientName} • ${job.job_name}`,
        entityId: job.id,
      })
    })

    return items
  }

  const loadTodaysJobs = async (userId: string): Promise<TodaysJob[]> => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data } = await supabase
      .from('jobs')
      .select('id, job_number, job_name, scheduled_date, clients(name)')
      .eq('user_id', userId)
      .gte('scheduled_date', today)
      .lt('scheduled_date', tomorrow)
      .order('scheduled_date')

    return data?.map(job => ({
      ...job,
      client: Array.isArray(job.clients) && job.clients.length > 0 ? { name: job.clients[0].name } : null
    })) || []
  }

  const filteredActions = urgencyFilter === 'all' ? actionItems : actionItems.filter(item => item.urgency === urgencyFilter)
  const urgentCount = actionItems.filter(a => a.urgency === 'urgent').length
  const warningCount = actionItems.filter(a => a.urgency === 'warning').length
  const infoCount = actionItems.filter(a => a.urgency === 'info').length

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
        <div className="bg-white border-b px-8 py-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-4 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* Header */}
      <div className="bg-white border-b px-4 md:px-8 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>Dashboard</h1>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Welcome Banner for first-time users */}
        <WelcomeBanner />

        {/* Urgent Alert */}
        {urgentCount > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 mt-0.5" />
              <div>
                <h2 className="text-lg md:text-xl font-bold mb-1">Urgent Action Required</h2>
                <p className="text-base md:text-lg opacity-90">
                  {urgentCount} {urgentCount === 1 ? 'item needs' : 'items need'} immediate attention
                </p>
              </div>
            </div>
            <button
              onClick={() => setUrgencyFilter('urgent')}
              className="w-full md:w-auto bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors"
            >
              Review Now →
            </button>
          </div>
        )}

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* Focus Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stats?.jobs_today || 0}
            </div>
            <div className="text-xs md:text-sm" style={{ color: colors.text.secondary }}>Jobs Today</div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {formatCurrency(stats?.outstanding_revenue || 0, false)}
            </div>
            <div className="text-xs md:text-sm" style={{ color: colors.text.secondary }}>Outstanding</div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {actionItems.length}
            </div>
            <div className="text-xs md:text-sm" style={{ color: colors.text.secondary }}>Need Action</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Action Queue */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold" style={{ color: colors.text.primary }}>
                  Action Queue
                </h2>
                <span className="text-xs md:text-sm" style={{ color: colors.text.secondary }}>
                  Live
                </span>
              </div>

              {/* Filter Pills */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-b flex flex-wrap gap-2">
                <button
                  onClick={() => setUrgencyFilter('urgent')}
                  className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    urgencyFilter === 'urgent' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Urgent ({urgentCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('warning')}
                  className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    urgencyFilter === 'warning' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  This Week ({warningCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('info')}
                  className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    urgencyFilter === 'info' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Scheduled ({infoCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    urgencyFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  All ({actionItems.length})
                </button>
              </div>

              {/* Action List */}
              <div className="p-4 md:p-6">
                {filteredActions.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-base md:text-lg font-medium" style={{ color: colors.text.primary }}>
                      All caught up!
                    </p>
                    <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                      No {urgencyFilter !== 'all' ? urgencyFilter : ''} items need attention
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActions.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 md:p-4 rounded-lg border-l-4 transition-all ${
                          item.urgency === 'urgent' ? 'border-red-500 bg-red-50' :
                          item.urgency === 'warning' ? 'border-orange-500 bg-orange-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>
                              {item.title}
                            </h3>
                            <p className="text-xs md:text-sm" style={{ color: colors.text.secondary }}>
                              {item.subtitle}
                            </p>
                          </div>
                          {item.amount && (
                            <div className="font-bold text-sm whitespace-nowrap" style={{ color: colors.text.primary }}>
                              {formatCurrency(item.amount)}
                            </div>
                          )}
                        </div>
                        <ActionButtons type={item.type} id={item.entityId} onActionComplete={() => loadDashboard()} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div
              className="px-6 py-6 md:py-8 text-white text-center"
              style={{ background: `linear-gradient(135deg, ${colors.primary.DEFAULT}, ${colors.primary.dark || '#0891b2'})` }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {new Date().toLocaleDateString('en-AU', { month: 'short' })}
              </div>
              <div className="text-4xl md:text-5xl font-bold my-2">
                {new Date().getDate()}
              </div>
              <div className="text-sm opacity-90">
                {new Date().toLocaleDateString('en-AU', { weekday: 'long' })}
              </div>
            </div>

            <div className="p-4 md:p-6">
              {todaysJobs.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                    No jobs scheduled today
                  </p>
                  <Link href="/dashboard/schedule" className="text-sm font-semibold" style={{ color: colors.primary.DEFAULT }}>
                    Schedule a job →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block p-3 md:p-4 rounded-lg border-l-4 border-cyan-500 bg-cyan-50 hover:shadow-md transition-all"
                    >
                      <div className="text-xs font-semibold text-cyan-600 mb-2">
                        {new Date(job.scheduled_date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>
                        {job.job_number}
                      </div>
                      <div className="text-sm" style={{ color: colors.text.secondary }}>
                        {job.client?.name || 'No client'}
                      </div>
                      <div className="text-xs mt-1 truncate" style={{ color: colors.text.secondary }}>
                        {job.job_name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard/schedule')}
                className="w-full mt-4 py-2.5 md:py-3 border-2 border-dashed rounded-lg font-semibold text-sm transition-colors hover:bg-cyan-50"
                style={{ borderColor: colors.border.DEFAULT, color: colors.primary.DEFAULT }}
              >
                + Add Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Create */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ color: colors.text.primary }}>
            Quick Create
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <Link
              href="/enquiries/new"
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 font-semibold text-xs md:text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">New Enquiry</span>
              <span className="sm:hidden">Enquiry</span>
            </Link>
            <Link
              href="/dashboard/quotes/new"
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 font-semibold text-xs md:text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <DollarSign className="w-5 h-5" />
              <span className="hidden sm:inline">New Quote</span>
              <span className="sm:hidden">Quote</span>
            </Link>
            <Link
              href="/dashboard/invoices/new"
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 font-semibold text-xs md:text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </Link>
            <Link
              href="/dashboard/timesheets"
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-white font-semibold text-xs md:text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Clock className="w-5 h-5" />
              <span className="hidden sm:inline">Clock In</span>
              <span className="sm:hidden">Clock In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
