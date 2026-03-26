/**
 * EXAMPLE: Dashboard Page Updated for Business Multi-Tenancy
 * This shows the exact changes needed
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/business'  // ✅ NEW IMPORT
import { colors } from '@/lib/colors'
// ... other imports

export default function DashboardPage() {
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // ✅ NEW: Get business_id instead of using user.id
      const businessId = await getBusinessId()
      if (!businessId) {
        router.push('/onboarding')  // Redirect to create business
        return
      }

      // ✅ CHANGED: Pass businessId instead of userId
      const [statsResult, actionsResult, jobsResult] = await Promise.all([
        loadStats(businessId),        // ❌ OLD: user.id
        loadActionItems(businessId),  // ❌ OLD: user.id
        loadTodaysJobs(businessId),   // ❌ OLD: user.id
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

  // ✅ CHANGED: Parameter from userId to businessId
  const loadStats = async (businessId: string): Promise<DashboardStats | null> => {
    const [invoicesResult, quotesResult, posResult, jobsResult] = await Promise.all([
      // ✅ CHANGED: .eq('user_id', userId) → .eq('business_id', businessId)
      supabase.from('invoices').select('status, payment_status, total_amount, due_date').eq('business_id', businessId),
      supabase.from('quotes').select('status, valid_until').eq('business_id', businessId),
      supabase.from('purchase_orders').select('status').eq('business_id', businessId),
      supabase.from('jobs').select('scheduled_date').eq('business_id', businessId)
    ])

    const invoices = invoicesResult.data || []
    const quotes = quotesResult.data || []
    const pos = posResult.data || []
    const jobs = jobsResult.data || []

    // ... rest of stats calculation (unchanged)

    return {
      outstanding_revenue: outstandingInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      unpaid_invoice_count: outstandingInvoices.length,
      jobs_today: jobs.filter(j => j.scheduled_date && j.scheduled_date.startsWith(today)).length,
      // ... etc
    }
  }

  // ✅ CHANGED: Parameter from userId to businessId
  const loadActionItems = async (businessId: string): Promise<ActionItem[]> => {
    const items: ActionItem[] = []

    // ✅ CHANGED: .eq('user_id', userId) → .eq('business_id', businessId)
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, due_date, status, payment_status, clients!inner(name)')
      .eq('business_id', businessId)  // ❌ OLD: .eq('user_id', userId)
      .eq('status', 'sent')
      .eq('payment_status', 'unpaid')
      .lt('due_date', new Date().toISOString())
      .order('due_date')
      .limit(5)

    overdueInvoices?.forEach(inv => {
      // ... (unchanged)
    })

    // ✅ CHANGED: Same for quotes
    const { data: expiringQuotes } = await supabase
      .from('quotes')
      .select('id, quote_number, total, valid_until, clients!inner(name)')
      .eq('business_id', businessId)  // ❌ OLD: .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('valid_until', new Date().toISOString())
      .lte('valid_until', new Date(Date.now() + 7 * 86400000).toISOString())
      .order('valid_until')
      .limit(5)

    // ✅ CHANGED: Same for jobs
    const { data: unscheduledJobs } = await supabase
      .from('jobs')
      .select('id, job_number, title, clients!inner(name)')
      .eq('business_id', businessId)  // ❌ OLD: .eq('user_id', userId)
      .eq('status', 'approved')
      .is('scheduled_date', null)
      .limit(5)

    return items
  }

  // ✅ CHANGED: Parameter from userId to businessId
  const loadTodaysJobs = async (businessId: string): Promise<TodaysJob[]> => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data } = await supabase
      .from('jobs')
      .select('id, job_number, title, scheduled_date, clients(name)')
      .eq('business_id', businessId)  // ❌ OLD: .eq('user_id', userId)
      .gte('scheduled_date', today)
      .lt('scheduled_date', tomorrow)
      .order('scheduled_date')

    return data?.map(job => ({
      ...job,
      job_name: job.title,
      client: Array.isArray(job.clients) && job.clients.length > 0 ? { name: job.clients[0].name } : null
    })) || []
  }

  // ... rest of component (unchanged)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* ... UI unchanged ... */}
    </div>
  )
}
