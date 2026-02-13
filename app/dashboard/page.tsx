'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { colors, getStatusColor } from '../../lib/colors'

type Stats = {
  totalJobs: number
  activeJobs: number
  totalRevenue: number
  totalClients: number
  overdueInvoices: number
  quotesExpiring: number
}

type RecentJob = {
  id: string
  title: string
  status: string
  total_amount: number
  created_at: string
  clients: {
    name: string
  } | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalRevenue: 0,
    totalClients: 0,
    overdueInvoices: 0,
    quotesExpiring: 0,
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentJobs()
  }, [])

  const fetchStats = async () => {
    const { data: jobs } = await supabase.from('jobs').select('*')
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: quotes } = await supabase.from('quotes').select('total, valid_until')
    const { data: invoices } = await supabase.from('invoices').select('*')

    const totalRevenue = quotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0
    const activeJobs = jobs?.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length || 0
    
    // Count overdue invoices
    const overdueInvoices = invoices?.filter(i => {
      if (!i.paid && i.due_date) {
        return new Date(i.due_date) < new Date()
      }
      return false
    }).length || 0
    
    // Count quotes expiring soon
    const quotesExpiring = quotes?.filter(q => {
      if (!q.valid_until) return false
      try {
        const validUntil = new Date(q.valid_until)
        const daysUntil = Math.floor((validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7 && daysUntil > 0
      } catch {
        return false
      }
    }).length || 0

    setStats({
      totalJobs: jobs?.length || 0,
      activeJobs,
      totalRevenue,
      totalClients: clients?.length || 0,
      overdueInvoices,
      quotesExpiring,
    })
    
    setLoading(false)
  }

  const fetchRecentJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        clients (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentJobs(data || [])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      change: null,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      change: null,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: null,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Clients',
      value: stats.totalClients,
      change: null,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  const actionItems = [
    {
      label: 'Overdue Invoices',
      count: stats.overdueInvoices,
      type: 'error' as const,
      href: '/dashboard/invoices',
    },
    {
      label: 'Quotes Expiring Soon',
      count: stats.quotesExpiring,
      type: 'warning' as const,
      href: '/dashboard/quotes',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow"
            style={{
              backgroundColor: colors.background.card,
              borderColor: colors.border.DEFAULT,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {kpi.value}
                </p>
              </div>
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}
              >
                <div style={{ color: colors.accent.DEFAULT }}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div 
          className="lg:col-span-2 rounded-lg border shadow-sm"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.DEFAULT }}>
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Recent Jobs
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
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm" style={{ color: colors.text.muted }}>
                      No jobs yet. <Link href="/dashboard/jobs/new" className="font-medium hover:underline" style={{ color: colors.accent.DEFAULT }}>Create your first job</Link>
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => {
                    const statusColor = getStatusColor(job.status)
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/dashboard/jobs/${job.id}`} className="text-sm font-medium hover:underline" style={{ color: colors.text.primary }}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: colors.text.primary }}>
                          {job.total_amount ? `$${job.total_amount.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Required */}
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

          <div className="p-6 space-y-4">
            {actionItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="block p-4 rounded-lg border hover:shadow-md transition-all"
                style={{
                  borderColor: item.type === 'error' ? colors.semantic.error : colors.semantic.warning,
                  backgroundColor: item.type === 'error' ? `${colors.semantic.error}05` : `${colors.semantic.warning}05`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {item.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                      Click to view
                    </p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{
                      backgroundColor: item.type === 'error' ? colors.semantic.error : colors.semantic.warning,
                      color: colors.text.inverse,
                    }}
                  >
                    {item.count}
                  </div>
                </div>
              </Link>
            ))}

            {stats.overdueInvoices === 0 && stats.quotesExpiring === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: `${colors.semantic.success}15` }}>
                  <svg className="h-6 w-6" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  All caught up!
                </p>
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                  No urgent actions needed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/jobs/new"
          className="p-6 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center group"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 transition-colors" style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}>
            <svg className="h-6 w-6 transition-colors" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Job
          </p>
        </Link>

        <Link
          href="/dashboard/quotes/new"
          className="p-6 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3" style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}>
            <svg className="h-6 w-6" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Quote
          </p>
        </Link>

        <Link
          href="/dashboard/clients/new"
          className="p-6 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3" style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}>
            <svg className="h-6 w-6" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            New Client
          </p>
        </Link>

        <Link
          href="/dashboard/jobs/kanban"
          className="p-6 rounded-lg border-2 border-dashed hover:border-solid hover:shadow-md transition-all text-center"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3" style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}>
            <svg className="h-6 w-6" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            Job Pipeline
          </p>
        </Link>
      </div>
    </div>
  )
}