'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { colors, getStatusColor } from '../../lib/colors'

type Stats = {
  revenueThisMonth: number
  revenueLastMonth: number
  jobsInProgress: number
  jobsToday: number
  overdueInvoices: number
  quotesExpiring: number
  unscheduledJobs: number
}

type Job = {
  id: string
  title: string
  status: string
  total_amount: number
  scheduled_date: string
  created_at: string
  assigned_to: string | null
  clients: {
    name: string
  } | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    jobsInProgress: 0,
    jobsToday: 0,
    overdueInvoices: 0,
    quotesExpiring: 0,
    unscheduledJobs: 0,
  })
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchJobs()
  }, [])

  const fetchStats = async () => {
    const { data: jobsData } = await supabase.from('jobs').select('*')
    const { data: quotes } = await supabase.from('quotes').select('total, created_at, valid_until, status')
    const { data: invoices } = await supabase.from('invoices').select('*')

    // Calculate revenue this month vs last month
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const revenueThisMonth = quotes?.filter(q => {
      const createdDate = new Date(q.created_at)
      return createdDate >= thisMonthStart && q.status === 'accepted'
    }).reduce((sum, q) => sum + (q.total || 0), 0) || 0

    const revenueLastMonth = quotes?.filter(q => {
      const createdDate = new Date(q.created_at)
      return createdDate >= lastMonthStart && createdDate <= lastMonthEnd && q.status === 'accepted'
    }).reduce((sum, q) => sum + (q.total || 0), 0) || 0

    // Jobs in progress
    const jobsInProgress = jobsData?.filter(j => 
      j.status === 'in_progress' || j.status === 'scheduled'
    ).length || 0

    // Jobs scheduled for today
    const today = new Date().toISOString().split('T')[0]
    const jobsToday = jobsData?.filter(j => {
      if (!j.scheduled_date) return false
      const jobDate = new Date(j.scheduled_date).toISOString().split('T')[0]
      return jobDate === today
    }).length || 0

    // Overdue invoices (>14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const overdueInvoices = invoices?.filter(i => {
      if (i.paid || !i.due_date) return false
      return new Date(i.due_date) < fourteenDaysAgo
    }).length || 0

    // Quotes expiring in next 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const quotesExpiring = quotes?.filter(q => {
      if (!q.valid_until || q.status !== 'sent') return false
      const validUntil = new Date(q.valid_until)
      return validUntil > now && validUntil <= threeDaysFromNow
    }).length || 0

    // Unscheduled jobs (approved but no date)
    const unscheduledJobs = jobsData?.filter(j => 
      j.status === 'approved' && !j.scheduled_date
    ).length || 0

    setStats({
      revenueThisMonth,
      revenueLastMonth,
      jobsInProgress,
      jobsToday,
      overdueInvoices,
      quotesExpiring,
      unscheduledJobs,
    })
    
    setLoading(false)
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        clients (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    setJobs(data || [])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  // Calculate revenue change percentage
  const revenueChange = stats.revenueLastMonth > 0 
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth * 100).toFixed(1)
    : 0
  type KPI = {
  label: string
  value: string | number
  subtext: string
  icon: React.ReactNode
  trend?: string | number
  href?: string
  urgent?: boolean
}

const kpis: KPI[] = [
    {
      label: 'Revenue This Month',
      value: `$${stats.revenueThisMonth.toLocaleString()}`,
      subtext: `Last month: $${stats.revenueLastMonth.toLocaleString()}`,
      trend: revenueChange,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Jobs In Progress',
      value: stats.jobsInProgress,
      subtext: 'Active work',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Jobs Today',
      value: stats.jobsToday,
      subtext: 'Scheduled today',
      href: '/dashboard/jobs?filter=today',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Overdue Invoices',
      value: stats.overdueInvoices,
      subtext: '> 14 days',
      urgent: stats.overdueInvoices > 0,
      href: '/dashboard/invoices?filter=overdue',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const actionItems = [
    {
      label: 'Overdue Invoices',
      sublabel: '> 14 days',
      count: stats.overdueInvoices,
      color: colors.semantic.error,
      href: '/dashboard/invoices?filter=overdue',
    },
    {
      label: 'Expiring Quotes',
      sublabel: 'in 3 days',
      count: stats.quotesExpiring,
      color: colors.semantic.warning,
      href: '/dashboard/quotes?filter=expiring',
    },
    {
      label: 'Unscheduled Jobs',
      sublabel: '',
      count: stats.unscheduledJobs,
      color: colors.semantic.info,
      href: '/dashboard/jobs?filter=unscheduled',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          if (kpi.href) {
            return (
              <Link
                key={index}
                href={kpi.href}
                className="rounded-lg p-6 border shadow-sm transition-all hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: colors.background.card,
                  borderColor: kpi.urgent ? colors.semantic.error : colors.border.DEFAULT,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ 
                      backgroundColor: kpi.urgent 
                        ? `${colors.semantic.error}15` 
                        : `${colors.accent.DEFAULT}15` 
                    }}
                  >
                    <div style={{ color: kpi.urgent ? colors.semantic.error : colors.accent.DEFAULT }}>
                      {kpi.icon}
                    </div>
                  </div>
                  {kpi.trend && (
                    <div className="text-right">
                      <span 
                        className="text-xs font-medium"
                        style={{ 
                          color: Number(kpi.trend) >= 0 ? colors.semantic.success : colors.semantic.error 
                        }}
                      >
                        {Number(kpi.trend) >= 0 ? '↑' : '↓'} {Math.abs(Number(kpi.trend))}%
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: colors.text.primary }}>
                    {kpi.value}
                  </p>
                  <p className="text-xs" style={{ color: colors.text.muted }}>
                    {kpi.subtext}
                  </p>
                </div>
              </Link>
            )
          }
          
          return (
            <div
              key={index}
              className="rounded-lg p-6 border shadow-sm transition-all"
              style={{
                backgroundColor: colors.background.card,
                borderColor: kpi.urgent ? colors.semantic.error : colors.border.DEFAULT,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="p-3 rounded-lg"
                  style={{ 
                    backgroundColor: kpi.urgent 
                      ? `${colors.semantic.error}15` 
                      : `${colors.accent.DEFAULT}15` 
                  }}
                >
                  <div style={{ color: kpi.urgent ? colors.semantic.error : colors.accent.DEFAULT }}>
                    {kpi.icon}
                  </div>
                </div>
                {kpi.trend && (
                  <div className="text-right">
                    <span 
                      className="text-xs font-medium"
                      style={{ 
                        color: Number(kpi.trend) >= 0 ? colors.semantic.success : colors.semantic.error 
                      }}
                    >
                      {Number(kpi.trend) >= 0 ? '↑' : '↓'} {Math.abs(Number(kpi.trend))}%
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  {kpi.value}
                </p>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  {kpi.subtext}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts & Action Required Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Target Chart */}
        <div 
          className="lg:col-span-2 rounded-lg border shadow-sm p-6"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Revenue vs. Target
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent.DEFAULT }}></div>
                <span style={{ color: colors.text.secondary }}>Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: colors.text.muted }}></div>
                <span style={{ color: colors.text.secondary }}>Target</span>
              </div>
            </div>
          </div>
          
          {/* Placeholder chart - in real app, use recharts or similar */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {[30, 45, 55, 65, 70, 75, 80, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: `${colors.accent.DEFAULT}40`,
                  }}
                ></div>
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required Panel */}
        <div 
          className="rounded-lg border shadow-sm"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Action Required
            </h3>
          </div>

          <div className="p-4 space-y-3">
            {actionItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="block p-4 rounded-lg hover:shadow-md transition-all"
                style={{
                  backgroundColor: `${item.color}08`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                        {item.count}
                      </p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {item.label}
                    </p>
                    {item.sublabel && (
                      <p className="text-xs" style={{ color: colors.text.muted }}>
                        {item.sublabel}
                      </p>
                    )}
                  </div>
                  <svg 
                    className="h-5 w-5" 
                    style={{ color: colors.text.muted }} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}

            {stats.overdueInvoices === 0 && stats.quotesExpiring === 0 && stats.unscheduledJobs === 0 && (
              <div className="text-center py-8">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                  style={{ backgroundColor: `${colors.semantic.success}15` }}
                >
                  <svg className="h-6 w-6" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  All caught up!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Overview Table */}
      <div 
        className="rounded-lg border shadow-sm"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.DEFAULT }}>
          <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            Job Overview
          </h3>
          <Link
            href="/dashboard/jobs"
            className="text-sm font-medium hover:underline"
            style={{ color: colors.accent.DEFAULT }}
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: colors.border.DEFAULT }}>
            <thead style={{ backgroundColor: colors.background.main }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: colors.text.muted }}>
                    No jobs yet. <Link href="/dashboard/jobs/new" className="font-medium hover:underline" style={{ color: colors.accent.DEFAULT }}>Create your first job</Link>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const statusColor = getStatusColor(job.status)
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/dashboard/jobs/${job.id}`} 
                          className="text-sm font-medium hover:underline" 
                          style={{ color: colors.text.primary }}
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.text.secondary }}>
                        {job.clients?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.text.secondary }}>
                        {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: colors.text.primary }}>
                        {job.total_amount ? `$${job.total_amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {job.status === 'completed' ? (
                          <span className="text-xs" style={{ color: colors.semantic.success }}>✓ Complete</span>
                        ) : job.status === 'in_progress' ? (
                          <span className="text-xs" style={{ color: colors.accent.DEFAULT }}>● Active</span>
                        ) : (
                          <span className="text-xs" style={{ color: colors.text.muted }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/dashboard/jobs/new"
          className="p-4 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
            style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
          >
            <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Job
          </p>
        </Link>

        <Link
          href="/dashboard/quotes/new"
          className="p-4 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
            style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
          >
            <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Quote
          </p>
        </Link>

        <Link
          href="/dashboard/clients/new"
          className="p-4 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
            style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
          >
            <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Client
          </p>
        </Link>

        <Link
          href="/dashboard/jobs/kanban"
          className="p-4 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
            style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
          >
            <svg className="h-5 w-5" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            Pipeline
          </p>
        </Link>
      </div>
    </div>
  )
}