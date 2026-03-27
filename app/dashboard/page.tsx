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
import { getBusinessId } from '@/lib/business'

type TodaysJob = {
  id: string
  job_number: string
  job_name: string
  scheduled_date: string
  client: { name: string } | null
  street_address?: string
  suburb?: string
  state?: string
  postcode?: string
}

export default function DashboardPage() {
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [todaysJobs, setTodaysJobs] = useState<TodaysJob[]>([])
  const [loading, setLoading] = useState(true)
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'warning' | 'info'>('urgent')
  const [urgentAlertClosed, setUrgentAlertClosed] = useState(false)

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

      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found for user')
        return
      }

      const [statsResult, actionsResult, jobsResult] = await Promise.all([
        loadStats(businessId),
        loadActionItems(businessId),
        loadTodaysJobs(businessId),
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

  const loadStats = async (businessId: string): Promise<DashboardStats | null> => {
    // Optimized: Single aggregation query instead of 10 separate queries
    const [invoicesResult, quotesResult, posResult, jobsResult] = await Promise.all([
      supabase.from('invoices').select('status, payment_status, total_amount, due_date').eq('business_id', businessId),
      supabase.from('quotes').select('status, valid_until').eq('business_id', businessId),
      supabase.from('purchase_orders').select('status').eq('business_id', businessId),
      supabase.from('jobs').select('start_date').eq('business_id', businessId)
    ])

    const invoices = invoicesResult.data || []
    const quotes = quotesResult.data || []
    const pos = posResult.data || []
    const jobs = jobsResult.data || []

    const today = new Date().toISOString().split('T')[0]
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date()

    // Calculate overdue invoices: status='sent' AND payment_status='unpaid' AND past due_date
    const overdueInvoices = invoices.filter(i => 
      i.status === 'sent' && 
      i.payment_status === 'unpaid' && 
      i.due_date && 
      new Date(i.due_date) < now
    )

    // Awaiting payment: status='sent' AND payment_status='unpaid' AND not overdue
    const awaitingPaymentInvoices = invoices.filter(i => 
      i.status === 'sent' && 
      i.payment_status === 'unpaid' && 
      (!i.due_date || new Date(i.due_date) >= now)
    )

    // Partially paid invoices
    const partiallyPaidInvoices = invoices.filter(i => i.payment_status === 'partial')

    // Outstanding = unpaid (not overdue) + overdue + partial
    const outstandingInvoices = [...awaitingPaymentInvoices, ...overdueInvoices, ...partiallyPaidInvoices]

    return {
      outstanding_revenue: outstandingInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      unpaid_invoice_count: outstandingInvoices.length,
      jobs_today: jobs.filter(j => j.start_date && j.start_date.startsWith(today)).length,
      overdue_invoices_count: overdueInvoices.length,
      expiring_quotes_count: quotes.filter(q => q.status === 'sent' && q.valid_until && q.valid_until >= new Date().toISOString() && q.valid_until <= oneWeekFromNow).length,
      invoices_draft: invoices.filter(i => i.status === 'draft').length,
      invoices_unpaid: awaitingPaymentInvoices.length,
      invoices_overdue: overdueInvoices.length,
      invoices_paid: invoices.filter(i => i.payment_status === 'paid').length,
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

  const loadActionItems = async (businessId: string): Promise<ActionItem[]> => {
    const items: ActionItem[] = []

    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, due_date, status, payment_status, client_id, clients!inner(id, name)')
      .eq('business_id', businessId)
      .eq('status', 'sent')
      .eq('payment_status', 'unpaid')
      .lt('due_date', new Date().toISOString())
      .order('due_date')
      .limit(5)

    overdueInvoices?.forEach(inv => {
      const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)
      const clientData = (inv.clients as any)
      const clientName = clientData?.name || 'Unknown client'
      const clientId = inv.client_id || clientData?.id
      items.push({
        id: inv.id,
        type: 'invoice',
        urgency: 'urgent',
        title: `Invoice ${inv.invoice_number} overdue`,
        subtitle: `${clientName} • ${daysOverdue} days overdue`,
        amount: inv.total_amount,
        entityId: inv.id,
        daysOverdue,
        invoice_number: inv.invoice_number,
        client_id: clientId,
        client_name: clientName,
      })
    })

    const { data: expiringQuotes } = await supabase
      .from('quotes')
      .select('id, quote_number, total, valid_until, client_id, clients!inner(id, name)')
      .eq('business_id', businessId)
      .eq('status', 'sent')
      .gte('valid_until', new Date().toISOString())
      .lte('valid_until', new Date(Date.now() + 7 * 86400000).toISOString())
      .order('valid_until')
      .limit(5)

    expiringQuotes?.forEach(quote => {
      const daysUntilExpiry = Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / 86400000)
      const clientData = (quote.clients as any)
      const clientName = clientData?.name || 'Unknown client'
      const clientId = quote.client_id || clientData?.id
      items.push({
        id: quote.id,
        type: 'quote',
        urgency: 'warning',
        title: `Quote ${quote.quote_number} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
        subtitle: clientName,
        amount: quote.total,
        entityId: quote.id,
        quote_number: quote.quote_number,
        client_id: clientId,
        client_name: clientName,
      })
    })

    const { data: unscheduledJobs } = await supabase
      .from('jobs')
      .select('id, job_number, title, client_id, clients!inner(id, name)')
      .eq('business_id', businessId)
      .eq('status', 'quoted')
      .is('start_date', null)
      .limit(5)

    unscheduledJobs?.forEach(job => {
      const clientData = (job.clients as any)
      const clientName = clientData?.name || 'Unknown client'
      const clientId = job.client_id || clientData?.id
      items.push({
        id: job.id,
        type: 'job',
        urgency: 'info',
        title: `Schedule job ${job.job_number}`,
        subtitle: `${clientName} • ${job.title}`,
        entityId: job.id,
        job_number: job.job_number,
        client_id: clientId,
        client_name: clientName,
      })
    })

    return items
  }

  const loadTodaysJobs = async (businessId: string): Promise<TodaysJob[]> => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    // Fetch jobs scheduled for today
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, job_number, title, start_date, street_address, suburb, state, postcode, clients(name)')
      .eq('business_id', businessId)
      .gte('start_date', today)
      .lt('start_date', tomorrow)
      .order('start_date')

    // Fetch appointments for today
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, title, start_time, job_id, jobs(job_number, street_address, suburb, state, postcode), clients(name)')
      .eq('business_id', businessId)
      .gte('start_time', today)
      .lt('start_time', tomorrow + 'T23:59:59')
      .order('start_time')

    const todayItems: TodaysJob[] = []

    // Add jobs
    jobs?.forEach(job => {
      todayItems.push({
        ...job,
        job_name: job.title,
        scheduled_date: job.start_date,
        client: Array.isArray(job.clients) && job.clients.length > 0 ? { name: job.clients[0].name } : null
      })
    })

    // Add appointments
    appointments?.forEach(apt => {
      const jobData = (apt as any).jobs // Type assertion to handle Supabase relation
      todayItems.push({
        id: apt.id,
        job_number: jobData?.job_number || apt.title,
        job_name: apt.title,
        scheduled_date: apt.start_time,
        client: Array.isArray(apt.clients) && apt.clients.length > 0 ? { name: apt.clients[0].name } : null,
        street_address: jobData?.street_address,
        suburb: jobData?.suburb,
        state: jobData?.state,
        postcode: jobData?.postcode,
      })
    })

    // Sort by scheduled time
    todayItems.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

    return todayItems
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
      <div className="bg-white border-b px-4 md:px-8 py-5 md:py-7">
        <h1 className="text-4xl md:text-3xl sm:text-2xl font-bold" style={{ color: colors.text.primary }}>Dashboard</h1>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Welcome Banner for first-time users */}
        <WelcomeBanner />

        {/* Urgent Alert */}
        {urgentCount > 0 && !urgentAlertClosed && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative">
            <button
              onClick={() => setUrgentAlertClosed(true)}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1"
              aria-label="Close alert"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 md:w-6 md:h-6 mt-0.5" />
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Urgent Action Required</h2>
                <p className="text-lg md:text-xl opacity-90">
                  {urgentCount} {urgentCount === 1 ? 'item needs' : 'items need'} immediate attention
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setUrgencyFilter('urgent')
                document.getElementById('action-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="w-full md:w-auto bg-white text-red-600 px-6 py-3.5 rounded-lg text-base font-bold hover:bg-red-50 transition-colors min-h-12"
            >
              Review Now →
            </button>
          </div>
        )}

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* Focus Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-6 md:p-5 sm:p-4 shadow-sm text-center">
            <div className="w-14 h-14 md:w-12 md:h-12 mx-auto mb-3 md:mb-2 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-7 h-7 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="text-4xl md:text-3xl sm:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stats?.jobs_today || 0}
            </div>
            <div className="text-base md:text-sm" style={{ color: colors.text.secondary }}>Jobs Today</div>
          </div>

          <div className="bg-white rounded-xl p-6 md:p-5 sm:p-4 shadow-sm text-center">
            <div className="w-14 h-14 md:w-12 md:h-12 mx-auto mb-3 md:mb-2 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-7 h-7 md:w-6 md:h-6 text-orange-600" />
            </div>
            <div className="text-4xl md:text-3xl sm:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {formatCurrency(stats?.outstanding_revenue || 0, false)}
            </div>
            <div className="text-base md:text-sm" style={{ color: colors.text.secondary }}>Outstanding</div>
          </div>

          <div className="bg-white rounded-xl p-6 md:p-5 sm:p-4 shadow-sm text-center">
            <div className="w-14 h-14 md:w-12 md:h-12 mx-auto mb-3 md:mb-2 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 md:w-6 md:h-6 text-red-600" />
            </div>
            <div className="text-4xl md:text-3xl sm:text-2xl font-bold" style={{ color: colors.text.primary }}>
              {actionItems.length}
            </div>
            <div className="text-base md:text-sm" style={{ color: colors.text.secondary }}>Need Action</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Action Queue */}
          <div id="action-queue" className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                  Action Queue
                </h2>
                <span className="text-sm md:text-base" style={{ color: colors.text.secondary }}>
                  Live
                </span>
              </div>

              {/* Filter Pills */}
              <div className="px-4 md:px-6 py-4 md:py-5 border-b flex flex-wrap gap-2">
                <button
                  onClick={() => setUrgencyFilter('urgent')}
                  className={`inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all min-h-11 ${
                    urgencyFilter === 'urgent' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  Urgent ({urgentCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('warning')}
                  className={`inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all min-h-11 ${
                    urgencyFilter === 'warning' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  This Week ({warningCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('info')}
                  className={`inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all min-h-11 ${
                    urgencyFilter === 'info' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  Scheduled ({infoCount})
                </button>
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className={`px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all min-h-11 ${
                    urgencyFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  All ({actionItems.length})
                </button>
              </div>

              {/* Action List */}
              <div className="p-4 md:p-6">
                {filteredActions.length === 0 ? (
                  <div className="text-center py-10 md:py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg md:text-xl font-medium" style={{ color: colors.text.primary }}>
                      All caught up!
                    </p>
                    <p className="text-base mt-2" style={{ color: colors.text.secondary }}>
                      No {urgencyFilter !== 'all' ? urgencyFilter : ''} items need attention
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActions.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 md:p-5 rounded-lg border-l-4 transition-all ${
                          item.urgency === 'urgent' ? 'border-red-500 bg-red-50' :
                          item.urgency === 'warning' ? 'border-orange-500 bg-orange-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base md:text-lg mb-1.5">
                              {/* Invoice/Quote/Job Number Link */}
                              {item.type === 'invoice' && item.invoice_number && (
                                <>
                                  <span style={{ color: colors.text.secondary }}>Invoice </span>
                                  <Link
                                    href={`/dashboard/invoices/${item.entityId}`}
                                    className="hover:underline"
                                    style={{ color: colors.primary.DEFAULT }}
                                  >
                                    {item.invoice_number}
                                  </Link>
                                  <span style={{ color: colors.text.secondary }}> overdue</span>
                                </>
                              )}
                              {item.type === 'quote' && item.quote_number && (
                                <>
                                  <span style={{ color: colors.text.secondary }}>Quote </span>
                                  <Link
                                    href={`/dashboard/quotes/${item.entityId}`}
                                    className="hover:underline"
                                    style={{ color: colors.primary.DEFAULT }}
                                  >
                                    {item.quote_number}
                                  </Link>
                                  <span style={{ color: colors.text.secondary }}> expires {item.title.split('expires')[1]}</span>
                                </>
                              )}
                              {item.type === 'job' && item.job_number && (
                                <>
                                  <span style={{ color: colors.text.secondary }}>Schedule job </span>
                                  <Link
                                    href={`/dashboard/jobs/${item.entityId}`}
                                    className="hover:underline"
                                    style={{ color: colors.primary.DEFAULT }}
                                  >
                                    {item.job_number}
                                  </Link>
                                </>
                              )}
                              {!item.invoice_number && !item.quote_number && !item.job_number && (
                                <span style={{ color: colors.text.primary }}>{item.title}</span>
                              )}
                            </div>
                            <p className="text-sm md:text-base" style={{ color: colors.text.secondary }}>
                              {/* Client Name Link */}
                              {item.client_id && item.client_name ? (
                                <>
                                  <Link
                                    href={`/dashboard/clients/${item.client_id}`}
                                    className="hover:underline font-medium"
                                    style={{ color: colors.primary.DEFAULT }}
                                  >
                                    {item.client_name}
                                  </Link>
                                  {item.subtitle.includes('•') && (
                                    <span> {item.subtitle.split('•').slice(1).join('•')}</span>
                                  )}
                                </>
                              ) : (
                                item.subtitle
                              )}
                            </p>
                          </div>
                          {item.amount && (
                            <div className="font-bold text-base md:text-lg whitespace-nowrap" style={{ color: colors.text.primary }}>
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
              className="px-6 py-7 md:py-8 text-white text-center"
              style={{ background: `linear-gradient(135deg, ${colors.primary.DEFAULT}, ${colors.primary.dark || '#0891b2'})` }}
            >
              <div className="text-sm font-semibold uppercase tracking-wide opacity-90">
                {new Date().toLocaleDateString('en-AU', { month: 'short' })}
              </div>
              <div className="text-5xl md:text-6xl font-bold my-2">
                {new Date().getDate()}
              </div>
              <div className="text-base opacity-90">
                {new Date().toLocaleDateString('en-AU', { weekday: 'long' })}
              </div>
            </div>

            <div className="p-4 md:p-6">
              {todaysJobs.length === 0 ? (
                <div className="text-center py-8 md:py-10">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-base mb-4" style={{ color: colors.text.secondary }}>
                    No jobs scheduled today
                  </p>
                  <Link href="/dashboard/schedule" className="text-base font-semibold" style={{ color: colors.primary.DEFAULT }}>
                    Schedule a job →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysJobs.map((job) => {
                    const address = [job.street_address, job.suburb, job.state, job.postcode].filter(Boolean).join(', ')
                    return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block p-4 md:p-5 rounded-lg border-l-4 border-cyan-500 bg-cyan-50 hover:shadow-md transition-all"
                    >
                      <div className="text-sm md:text-base font-semibold text-cyan-600 mb-2">
                        {new Date(job.scheduled_date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="font-semibold text-base md:text-lg mb-1.5" style={{ color: colors.text.primary }}>
                        {job.job_number}
                      </div>
                      <div className="text-base mb-1" style={{ color: colors.text.secondary }}>
                        {job.client?.name || 'No client'}
                      </div>
                      {address && (
                        <div className="text-sm" style={{ color: colors.text.muted }}>
                          📍 {address}
                        </div>
                      )}
                    </Link>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard/schedule')}
                className="w-full mt-4 py-3 md:py-3.5 border-2 border-dashed rounded-lg font-semibold text-base transition-colors hover:bg-cyan-50 min-h-12"
                style={{ borderColor: colors.border.DEFAULT, color: colors.primary.DEFAULT }}
              >
                + Add Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Create */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Quick Create
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/enquiries/new"
              className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-lg border-2 font-semibold text-sm md:text-base transition-all hover:bg-gray-50 min-h-12"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden sm:inline">New Enquiry</span>
              <span className="sm:hidden">Enquiry</span>
            </Link>
            <Link
              href="/dashboard/quotes/new"
              className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-lg border-2 font-semibold text-sm md:text-base transition-all hover:bg-gray-50 min-h-12"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden sm:inline">New Quote</span>
              <span className="sm:hidden">Quote</span>
            </Link>
            <Link
              href="/dashboard/invoices/new"
              className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-lg border-2 font-semibold text-sm md:text-base transition-all hover:bg-gray-50 min-h-12"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
            >
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </Link>
            <Link
              href="/dashboard/timesheets"
              className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-lg text-white font-semibold text-sm md:text-base transition-all hover:opacity-90 min-h-12"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden sm:inline">Clock In</span>
              <span className="sm:hidden">Clock In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
