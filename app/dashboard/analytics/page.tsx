'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { CheckCircle2, BarChart3, AlertTriangle, Info } from 'lucide-react'

type MarginMetrics = {
  totalGrossProfit: number
  averageMargin: number
  invoicesWithCostData: number
  totalInvoices: number
  quoteWinRate: number
  avgCacPerJob: number
}

type CostBreakdown = {
  materialCost: number
  labourCost: number
  acquisitionCost: number
  subcontractorCost: number
}

type ProfitableJob = {
  id: string
  job_number: string
  job_name: string
  total_revenue: number
  total_cost: number
  gross_profit: number
  margin: number
  invoice_count: number
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MarginMetrics>({
    totalGrossProfit: 0,
    averageMargin: 0,
    invoicesWithCostData: 0,
    totalInvoices: 0,
    quoteWinRate: 0,
    avgCacPerJob: 0,
  })
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    materialCost: 0,
    labourCost: 0,
    acquisitionCost: 0,
    subcontractorCost: 0,
  })
  const [profitableJobs, setProfitableJobs] = useState<ProfitableJob[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch jobs with financial data (all aggregated by triggers)
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_name, job_number, status, invoiced_amount, quoted_amount, total_cost, total_material_cost, total_labour_cost, total_acquisition_cost, total_subcontractor_cost, gross_profit, margin')
        .eq('user_id', user.id)
        .not('invoiced_amount', 'is', null) // Only jobs that have been invoiced

      if (jobs && jobs.length > 0) {
        // Total metrics
        const totalProfit = jobs.reduce((sum, job) => sum + (job.gross_profit || 0), 0)
        const avgMargin = jobs.reduce((sum, job) => sum + (job.margin || 0), 0) / jobs.length
        const jobsWithRevenue = jobs.length

        // Total jobs count
        const { count: totalJobsCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Cost breakdown (aggregated from all jobs)
        const materialCostTotal = jobs.reduce((sum, job) => sum + (job.total_material_cost || 0), 0)
        const labourCostTotal = jobs.reduce((sum, job) => sum + (job.total_labour_cost || 0), 0)
        const acquisitionCostTotal = jobs.reduce((sum, job) => sum + (job.total_acquisition_cost || 0), 0)
        const subcontractorCostTotal = jobs.reduce((sum, job) => sum + (job.total_subcontractor_cost || 0), 0)

        setCostBreakdown({
          materialCost: materialCostTotal,
          labourCost: labourCostTotal,
          acquisitionCost: acquisitionCostTotal,
          subcontractorCost: subcontractorCostTotal,
        })

        // Quote win rate (quotes with is_accepted = true vs total)
        const { data: allQuotes } = await supabase
          .from('quotes')
          .select('is_accepted')
          .eq('user_id', user.id)

        let winRate = 0
        if (allQuotes && allQuotes.length > 0) {
          const acceptedQuotes = allQuotes.filter((q) => q.is_accepted === true).length
          winRate = (acceptedQuotes / allQuotes.length) * 100
        }

        // Average CAC per job
        let avgCac = 0
        if (jobs.length > 0 && acquisitionCostTotal > 0) {
          avgCac = acquisitionCostTotal / jobs.length
        }

        setMetrics({
          totalGrossProfit: totalProfit,
          averageMargin: avgMargin,
          invoicesWithCostData: jobsWithRevenue,
          totalInvoices: totalJobsCount || 0,
          quoteWinRate: winRate,
          avgCacPerJob: avgCac,
        })

        // Most profitable jobs (already aggregated, just sort)
        const profitableJobsList = jobs
          .filter((job: any) => job.total_cost > 0 && job.gross_profit > 0)
          .sort((a: any, b: any) => b.gross_profit - a.gross_profit)
          .slice(0, 10)
          .map((job: any) => ({
            id: job.id,
            job_number: job.job_number || 'N/A',
            job_name: job.job_name || 'N/A',
            total_revenue: job.invoiced_amount || 0,
            total_cost: job.total_cost || 0,
            gross_profit: job.gross_profit || 0,
            margin: job.margin || 0,
            invoice_count: 1, // Jobs aggregate all invoices
          }))

        setProfitableJobs(profitableJobsList)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const pieChartData = [
    { name: 'Materials', value: costBreakdown.materialCost },
    { name: 'Labour', value: costBreakdown.labourCost },
    { name: 'Acquisition', value: costBreakdown.acquisitionCost },
    { name: 'Subcontractors', value: costBreakdown.subcontractorCost },
  ].filter((item) => item.value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
          Profit & Margin Analytics
        </h1>
        <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
          Real-time insights into your business profitability
        </p>
      </div>

      <div className="p-8">
        {/* Profit & Margin Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Total Gross Profit
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: colors.accent.DEFAULT }}>
              ${metrics.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs" style={{ color: colors.text.secondary }}>
              Across {metrics.invoicesWithCostData} invoices with cost data
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Average Margin
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: metrics.averageMargin > 30 ? '#10b981' : metrics.averageMargin > 15 ? '#f59e0b' : '#ef4444' }}>
              {metrics.averageMargin.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.secondary }}>
              {metrics.averageMargin > 30 ? (
                <>
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>Excellent!</span>
                </>
              ) : metrics.averageMargin > 15 ? (
                <>
                  <BarChart3 size={14} className="text-yellow-500" />
                  <span>Good</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} className="text-red-500" />
                  <span>Below target</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Jobs with Revenue
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: colors.text.primary }}>
              {metrics.invoicesWithCostData}
            </div>
            <div className="text-xs" style={{ color: colors.text.secondary }}>
              of {metrics.totalInvoices} total jobs ({metrics.totalInvoices > 0 ? ((metrics.invoicesWithCostData / metrics.totalInvoices) * 100).toFixed(0) : 0}%)
            </div>
          </div>
        </div>

        {/* Cost Breakdown & CAC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cost Breakdown Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
              Cost Breakdown
            </h2>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) => {
                      if (value === undefined) return '$0.00'
                      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No cost data available yet
              </div>
            )}
          </div>

          {/* Customer Acquisition Cost */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
              Customer Acquisition Cost (CAC)
            </h2>
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Average CAC per Job
                </div>
                <div className="text-4xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                  ${metrics.avgCacPerJob.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                  Measure & Quote time allocated per job
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Quote Win Rate
                </div>
                <div className="text-4xl font-bold" style={{ color: metrics.quoteWinRate > 50 ? '#10b981' : '#f59e0b' }}>
                  {metrics.quoteWinRate.toFixed(1)}%
                </div>
                <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                  {metrics.quoteWinRate > 50 ? '🎯 Above average!' : '📊 Industry avg: 50%'}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">💡 Tip</p>
                <p className="text-xs text-blue-700 mt-1">
                  Track M&Q time on timesheets to see accurate CAC per job. Lower CAC with higher win rates = better profitability!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Profitable Jobs */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Most Profitable Jobs
          </h2>
          {profitableJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Job #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Title</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cost</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Margin</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {profitableJobs.map((job, index) => (
                    <tr key={job.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 text-sm font-medium" style={{ color: colors.text.primary }}>
                        {job.job_number}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.text.primary }}>
                        {job.job_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold" style={{ color: colors.text.primary }}>
                        ${job.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right" style={{ color: colors.text.secondary }}>
                        ${job.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-bold" style={{ color: job.gross_profit > 5000 ? '#10b981' : '#3b82f6' }}>
                        ${job.gross_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold" style={{ color: job.margin > 30 ? '#10b981' : job.margin > 15 ? '#f59e0b' : '#ef4444' }}>
                        {job.margin.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-center" style={{ color: colors.text.secondary }}>
                        {job.invoice_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No job profitability data yet</p>
              <p className="text-sm text-gray-400">
                Start tracking costs on your invoices to see which jobs are most profitable!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
